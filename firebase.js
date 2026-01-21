
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  enableIndexedDbPersistence
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "KfMCdlbnxttVDKFzEw0eUGELE",
  authDomain: "boetesystem-lag.firebaseapp.com",
  projectId: "boetesystem-lag",
  storageBucket: "boetesystem-lag.firebasestorage.app",
  messagingSenderId: "556652421070",
  appId: "1:556652421070:web:77d8dc297bb045968d559f"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// 🔥 Offline-first
enableIndexedDbPersistence(db).catch((err) => {
  console.warn("Offline persistence error:", err.code);
});