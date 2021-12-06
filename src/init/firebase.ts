import { initializeApp } from "@firebase/app";
import { collection, doc, getFirestore } from "@firebase/firestore";
import { getAnalytics } from "firebase/analytics";

let initialised = false;

export function initFirebase() {
  if (initialised) {
    return;
  }
  const firebaseConfig = {
    apiKey: "AIzaSyC20iXXpPytfkhDhTNb3O7-gdFpJ57G-sE",
    authDomain: "all-stations-to-central.firebaseapp.com",
    projectId: "all-stations-to-central",
    storageBucket: "all-stations-to-central.appspot.com",
    messagingSenderId: "411622419290",
    appId: "1:411622419290:web:231833cfba10260dae2163",
    measurementId: "G-PEBD7SSDN9",
  };

  // Initialize Firebase
  initializeApp(firebaseConfig);
  getAnalytics();
  initialised = true;
}

initFirebase();

export const db = getFirestore();
export const docRef = (path: string, ...args: string[]) =>
  doc(db, path, ...args);
export const collectionRef = (path: string, ...args: string[]) =>
  collection(db, path, ...args);
