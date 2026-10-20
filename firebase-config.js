// Firebase web configuration.
// Replace every placeholder below with the values from Firebase Console.
// Do not put service-account private keys or Admin SDK credentials here.

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCp_17QHcwmu1mkM9smFZm5iqEHHge7MSY",
  authDomain: "myregistration-1d213.firebaseapp.com",
  projectId: "myregistration-1d213",
  storageBucket: "myregistration-1d213.firebasestorage.app",
  messagingSenderId: "212036707195",
  appId: "1:212036707195:web:7702b87216be2254cc13de",
  measurementId: "G-09ZMGPJ541"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
