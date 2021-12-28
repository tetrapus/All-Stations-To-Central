import { Stack } from "atoms/Stack";
import React from "react";
import { TextButton } from "atoms/TextButton";
import { TextInput } from "atoms/TextInput";
import { useHistory } from "react-router";
import { useLocalStorage } from "@rehooks/local-storage";
import { Instructions } from "./Instructions";
import { GameEngine } from "../util/game-engine";

export function Homepage() {
  const history = useHistory();
  const [username] = useLocalStorage<string>("username");
  if (!username) {
    return null;
  }

  return (
    <Stack css={{ margin: "auto", width: 300, alignItems: "center" }}>
      <h1>All Stations To Central</h1>
      <>
        <TextButton
          onClick={async () => {
            const code = await GameEngine.createGame(username);
            history.push(`/${code}`);
          }}
        >
          New Game
        </TextButton>
        <span css={{ marginTop: 24, marginBottom: 16 }}>or</span>
        <TextInput
          placeholder="Enter Code"
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              history.push(`/${e.currentTarget.value}`);
            }
          }}
        ></TextInput>
      </>
      <Instructions />
    </Stack>
  );
}
