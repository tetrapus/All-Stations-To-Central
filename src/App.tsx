import React, { useState } from "react";
import "./App.css";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import { Homepage } from "pages/Homepage";
import { TextInput } from "atoms/TextInput";
import { GamePage } from "./pages/GamePage";
import { traingame } from "util/traingame";

function App() {
  const [username, setUsername] = useState<string | null>(
    localStorage.getItem("username")
  );

  const [results, setResults] = useState<{ ops: string }[]>([]);

  return (
    <>
      <Router>
        <Switch>
          <Route path="/traingame">
            <div>
              <TextInput
                placeholder="Enter 4 digits"
                maxLength={4}
                onChange={(e) => {
                  if (!e.currentTarget.value.match(/^\d{4}$/)) {
                    return;
                  }
                  setResults(
                    traingame(
                      [...e.currentTarget.value].map(Number) as [
                        number,
                        number,
                        number,
                        number
                      ]
                    )
                  );
                }}
              />
              {results.map(({ ops }) => (
                <div>{ops.slice(1, -1)}</div>
              ))}
            </div>
          </Route>
          {username ? (
            <>
              <Route path="/:id">
                <GamePage />
              </Route>
              <Route path="/">
                <Homepage />
              </Route>
            </>
          ) : (
            <>
              <strong>Choose a Username</strong>
              <TextInput
                onKeyPress={(event) => {
                  if (event.key === "Enter") {
                    setUsername(event.currentTarget.value);
                    localStorage.setItem("username", event.currentTarget.value);
                  }
                }}
              />
            </>
          )}
        </Switch>
      </Router>
    </>
  );
}

export default App;
