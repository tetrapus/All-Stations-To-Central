import React, { useEffect, useState } from "react";
import "./App.css";
import { BrowserRouter as Router } from "react-router-dom";
import { initFirebase } from "./init/firebase";

initFirebase();

function App() {
  const systemDarkMode = window.matchMedia("(prefers-color-scheme: dark)");
  const [, setDarkMode] = useState(systemDarkMode.matches);
  useEffect(() => {
    if (!systemDarkMode.addEventListener) {
      return;
    }
    systemDarkMode.addEventListener("change", (event) => {
      setDarkMode(event.matches);
    });
  }, [systemDarkMode, setDarkMode]);

  return <Router>woah an app cool</Router>;
}

export default App;
