// src/firebase.js
import { GoogleAuthProvider, getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { collection, getFirestore } from "firebase/firestore";
import { useFirebaseApp } from "vuefire";

const firebaseConfig = {
  apiKey: "AIzaSyD26oNshoW8O42dt8fAEU0ySwSA3vYqh9k",
  authDomain: "vue-examen-52ab6.firebaseapp.com",
  projectId: "vue-examen-52ab6",
  storageBucket: "vue-examen-52ab6.firebasestorage.app",
  messagingSenderId: "717706290189",
  appId: "1:717706290189:web:3810f0cf21fc17a38be144",
  measurementId: "G-313VS3LVRP"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(useFirebaseApp);


const inmueblesref = collection(db , "INMUEBLES")

// Crear el proveedor de Google
const googleAuthProvider = new GoogleAuthProvider();

// Exportar las configuraciones necesarias
export { firebaseConfig, googleAuthProvider, getAuth, inmueblesref,db };
