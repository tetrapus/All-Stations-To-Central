import React, { useEffect, useState } from "react";
import "./App.css";
import { BrowserRouter as Router, Route } from "react-router-dom";
import { Homepage } from "pages/Homepage";
import { Game } from "pages/game/Game";

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
      <Route path="/:id">
        <Game />
      </Route>
    </Router>
  );
}

export default App;
