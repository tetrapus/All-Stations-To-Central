import firebase from "firebase";
import { useCallback, useEffect, useState } from "react";

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
  firebase.initializeApp(firebaseConfig);
  firebase.analytics();
  initialised = true;
}

initFirebase();

export const db = firebase.firestore();

export function useFirestoreDoc<S, T>(
  rootDoc: S | undefined | null,
  collectionFn: (
    rootDoc: S
  ) =>
    | firebase.firestore.DocumentReference<firebase.firestore.DocumentData>
    | undefined,
  transformerFn: (
    snapshot: firebase.firestore.DocumentSnapshot<firebase.firestore.DocumentData>
  ) => T
): T | undefined {
  const [state, setState] = useState<T>();
  useEffect(() => {
    console.log("Snapshot updated:", state);
  }, [state]);
  const collection = useCallback(collectionFn, []);
  const transformer = useCallback(transformerFn, []);
  useEffect(() => {
    if (!rootDoc) {
      return;
    }
    const query = collection(rootDoc);
    if (!query) {
      return;
    }
    return query.onSnapshot((snapshot) => setState(transformer(snapshot)));
  }, [rootDoc, collection, transformer]);
  return state;
}

export function useFirestore<S, T>(
  rootDoc: S | undefined | null,
  collectionFn: (
    rootDoc: S
  ) => firebase.firestore.Query<firebase.firestore.DocumentData> | undefined,
  transformerFn: (
    snapshot: firebase.firestore.QuerySnapshot<firebase.firestore.DocumentData>
  ) => T
): T | undefined {
  const [state, setState] = useState<T>();
  useEffect(() => {
    console.log("Snapshot updated:", state);
  }, [state]);
  const collection = useCallback(collectionFn, []);
  const transformer = useCallback(transformerFn, []);
  useEffect(() => {
    if (!rootDoc) {
      return;
    }
    const query = collection(rootDoc);
    if (!query) {
      return;
    }
    return query.onSnapshot((snapshot) => setState(transformer(snapshot)));
  }, [rootDoc, collection, transformer]);
  return state;
}
