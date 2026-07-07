const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");

// Inicializar el SDK de administración de Firebase
admin.initializeApp();

// Definir el secreto de la API Key en Google Cloud Secret Manager
const openRouterKey = defineSecret("OPENROUTER_API_KEY");

/**
 * Cloud Function v2: askAI
 * Recibe un prompt y opcionalmente un modelo, systemPrompt, imageBase64 y maxTokens.
 * Llama a OpenRouter de forma segura utilizando la clave secreta del servidor.
 */
exports.askAI = onCall({ secrets: [openRouterKey], memory: "2Gi", timeoutSeconds: 300 }, async (request) => {
  // Para agilizar el desarrollo inicial permitimos llamadas libres.
  // Puedes forzar request.auth si usas Firebase Auth.
  
  const { prompt, model, systemPrompt, imageBase64, maxTokens } = request.data;

  if (!prompt) {
    throw new HttpsError("invalid-argument", "El parámetro 'prompt' es obligatorio.");
  }

  // Clave secreta obtenida de Secret Manager en tiempo de ejecución
  const apiKey = openRouterKey.value();
  if (!apiKey) {
    throw new HttpsError("failed-precondition", "La API Key de OpenRouter no está configurada en el servidor.");
  }

  // Modelo predeterminado: gemini-2.5-flash (multimodal, rápido y económico)
  const targetModel = model || "google/gemini-2.5-flash";

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
          url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
        }
      }
    ];
  }
  messages.push({ role: "user", content: userContent });

  // Construir el body de la petición
  const requestBody = {
    model: targetModel,
    messages: messages,
  };

  // Limitar tokens de output si se especifica (útil para SVG de boceto)
  if (maxTokens && Number.isInteger(maxTokens) && maxTokens > 0) {
    requestBody.max_tokens = maxTokens;
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://puertas-bellhogar.web.app",
        "X-Title": "BellHogar Puertas"
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error de OpenRouter:", errorText);
      throw new HttpsError("unavailable", `Error de OpenRouter API: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.choices || data.choices.length === 0) {
      throw new HttpsError("internal", "No se recibió ninguna respuesta de los modelos de OpenRouter.");
    }

    // Retornar la respuesta generada por la IA
    return {
      text: data.choices[0].message.content,
      modelUsed: data.model || targetModel
    };

  } catch (error) {
    console.error("Error al procesar la solicitud de IA:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", `Error interno del servidor: ${error.message}`);
  }
});
