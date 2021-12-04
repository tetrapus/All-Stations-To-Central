import React, { useEffect, useState } from "react";
import "./App.css";
import { BrowserRouter as Router, Route } from "react-router-dom";
import { initFirebase } from "./init/firebase";
import { Homepage } from "pages/Homepage";

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

  return (
    <Router>
      <Route path="/">
        <Homepage />
      </Route>
    </Router>
  );
}

export default App;
