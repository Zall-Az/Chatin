import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAziwIXoybrbzM0tKv3dGwGj2pdrssgsGI",
  authDomain: "login-auth-7c7d9.firebaseapp.com",
  projectId: "login-auth-7c7d9",
  storageBucket: "login-auth-7c7d9.firebasestorage.app",
  messagingSenderId: "164070558565",
  appId: "1:164070558565:web:f718d34c8f326e3a496f8c",
  measurementId: "G-3Y97N96DQN"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const analytics = getAnalytics(app);