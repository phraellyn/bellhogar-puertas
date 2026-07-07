import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyCREimqpYcyRGTf_6hEd8Vi2DvrC4HGBc4",
  authDomain: "puertas-bellhogar.firebaseapp.com",
  projectId: "puertas-bellhogar",
  storageBucket: "puertas-bellhogar.firebasestorage.app",
  messagingSenderId: "260977729574",
  appId: "1:260977729574:web:15a82b444c835ce65b86e7",
  measurementId: "G-78GSKGJJYS"
};

const app = initializeApp(firebaseConfig);

// Inicializar Firestore con soporte de persistencia local offline (retina/iPad ready)
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export const storage = getStorage(app);

export const functions = getFunctions(app);


