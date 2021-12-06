import React, { useEffect, useState } from "react";
import "./App.css";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import { Homepage } from "pages/Homepage";
import { GameInterface } from "./pages/game/GameInterface";
import useLocalStorage from "@rehooks/local-storage";
import { TextInput } from "atoms/TextInput";

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

  const [username, setUsername] = useLocalStorage<string>("username");

  return (
    <>
      {username ? (
        <Router>
          <Switch>
            <Route path="/:id">
              <GameInterface />
            </Route>
            <Route path="/">
              <Homepage />
            </Route>
          </Switch>
        </Router>
      ) : (
        <>
          <strong>Choose a Username</strong>
          <TextInput
            onKeyPress={(event) => {
              if (event.key === "Enter") {
                setUsername(event.currentTarget.value);
              }
            }}
          />
        </>
      )}
    </>
  );
}

export default App;
