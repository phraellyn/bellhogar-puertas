const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");

// Inicializar el SDK de administración de Firebase
admin.initializeApp();

// Definir el secreto de la API Key en Google Cloud Secret Manager
const openRouterKey = defineSecret("OPENROUTER_API_KEY");

/**
 * Cloud Function v2: askAI
 * Recibe un prompt y opcionalmente modelos, systemPrompt, imageBase64 y maxTokens.
 * Llama a OpenRouter de forma segura utilizando la clave secreta del servidor.
 */
exports.askAI = onCall({ secrets: [openRouterKey], memory: "2Gi", timeoutSeconds: 300 }, async (request) => {
  // Para agilizar el desarrollo inicial permitimos llamadas libres.
  // Puedes forzar request.auth si usas Firebase Auth.
  
  const {
    prompt,
    model,
    fallbackModels,
    systemPrompt,
    imageBase64,
    maxTokens,
    temperature,
    reasoningEffort,
    optimizeForSpeed = false,
    requestTimeoutMs
  } = request.data;

  if (!prompt) {
    throw new HttpsError("invalid-argument", "El parámetro 'prompt' es obligatorio.");
  }
  if (typeof prompt !== "string" || prompt.length > 60000) {
    throw new HttpsError("invalid-argument", "El prompt no es válido o es demasiado largo.");
  }
  if (imageBase64 && (typeof imageBase64 !== "string" || imageBase64.length > 12000000)) {
    throw new HttpsError("invalid-argument", "La imagen supera el tamaño máximo permitido.");
  }

  // Clave secreta obtenida de Secret Manager en tiempo de ejecución
  const apiKey = openRouterKey.value();
  if (!apiKey) {
    throw new HttpsError("failed-precondition", "La API Key de OpenRouter no está configurada en el servidor.");
  }

  // Modelo multimodal actual con buena relación calidad/latencia.
  const targetModel = model || "google/gemini-3.5-flash";
  const modelPattern = /^[~a-z0-9._:-]+\/[a-z0-9._:-]+$/i;
  if (!modelPattern.test(targetModel)) {
    throw new HttpsError("invalid-argument", "El identificador de modelo no es válido.");
  }
  const safeFallbackModels = Array.isArray(fallbackModels)
    ? [...new Set(fallbackModels)]
      .filter((item) => typeof item === "string" && modelPattern.test(item) && item !== targetModel)
      .slice(0, 3)
    : [];

  const messages = [];
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }

  let userContent = prompt;
  if (imageBase64) {
    userContent = [
      { type: "text", text: prompt },
      {
        type: "image_url",
        image_url: {
          url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`,
          detail: "high"
        }
      }
    ];
  }
  messages.push({ role: "user", content: userContent });

  // Construir el body de la petición
  const requestBody = {
    model: targetModel,
    messages: messages,
    temperature: typeof temperature === "number"
      ? Math.min(1, Math.max(0, temperature))
      : 0.15,
  };

  if (safeFallbackModels.length) {
    requestBody.models = safeFallbackModels;
  }

  if (["minimal", "low", "medium", "high"].includes(reasoningEffort)) {
    requestBody.reasoning = { effort: reasoningEffort, exclude: true };
  }

  if (optimizeForSpeed) {
    requestBody.provider = {
      sort: "throughput",
      allow_fallbacks: true
    };
  }

  // Limitar tokens de output si se especifica (útil para SVG de boceto)
  if (maxTokens && Number.isInteger(maxTokens) && maxTokens > 0) {
    requestBody.max_tokens = maxTokens;
  }

  const controller = new AbortController();
  const timeoutMs = Number.isFinite(requestTimeoutMs)
    ? Math.min(240000, Math.max(30000, requestTimeoutMs))
    : 180000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://puertas-bellhogar.web.app",
        "X-Title": "BellHogar Puertas"
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    const rawResponse = await response.text();
    let data;
    try {
      data = rawResponse ? JSON.parse(rawResponse) : null;
    } catch (parseError) {
      console.error("Respuesta incompleta/no JSON de OpenRouter", {
        status: response.status,
        length: rawResponse.length,
        requestId: response.headers.get("x-request-id") || null
      });
      throw new HttpsError("unavailable", "OpenRouter devolvió una respuesta incompleta. Vuelve a intentarlo.");
    }

    if (!response.ok) {
      const providerMessage = data?.error?.message || response.statusText || "Error desconocido";
      console.error("Error de OpenRouter", {
        status: response.status,
        model: targetModel,
        message: providerMessage
      });
      throw new HttpsError("unavailable", `OpenRouter (${response.status}): ${providerMessage}`);
    }

    if (!data.choices || data.choices.length === 0) {
      throw new HttpsError("internal", "No se recibió ninguna respuesta de los modelos de OpenRouter.");
    }

    const messageContent = data.choices[0]?.message?.content;
    const normalizedContent = Array.isArray(messageContent)
      ? messageContent.map((part) => typeof part === "string" ? part : (part?.text || "")).join("")
      : messageContent;

    if (typeof normalizedContent !== "string" || !normalizedContent.trim()) {
      throw new HttpsError("internal", "El modelo no devolvió contenido utilizable.");
    }

    // Retornar la respuesta generada por la IA
    return {
      text: normalizedContent,
      modelUsed: data.model || targetModel,
      finishReason: data.choices[0].finish_reason || null,
      usage: data.usage || null
    };

  } catch (error) {
    console.error("Error al procesar la solicitud de IA:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    if (error?.name === "AbortError") {
      throw new HttpsError("deadline-exceeded", "La IA superó el tiempo máximo de respuesta.");
    }
    throw new HttpsError("internal", `Error interno del servidor: ${error.message}`);
  } finally {
    clearTimeout(timeout);
  }
});
