import { Stack } from "atoms/Stack";
import React from "react";
import { TextButton } from "atoms/TextButton";
import { TextInput } from "atoms/TextInput";
import stations from "data/stations.json";
import { useHistory } from "react-router";
import { useLocalStorage } from "@rehooks/local-storage";
import { setDoc, Timestamp } from "@firebase/firestore";
import { docRef } from "init/firebase";
import { Game } from "data/Game";
import { Player } from "../data/Game";

const randomElement = (array: any[]) =>
  array[Math.floor(Math.random() * array.length)];

function generateCode() {
  return `${randomElement(stations).code}-${randomElement(stations).code}`;
}

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
            const code = generateCode();
            const game: Game = {
              id: code,
              created: Timestamp.now(),
              isStarted: false,
              map: "sydney",
              turn: 0,
            };
            await setDoc(docRef("games", code), game);
            const player: Player = {
              name: username,
              order: 1,
              hand: [],
              routes: [],
              trainCount: 45,
              stationCount: 0,
            };
            await setDoc(docRef("games", code, "players", username), player);
            history.push(`/${code}`);
          }}
        >
          New Game
        </TextButton>
        <span css={{ marginTop: 24, marginBottom: 16 }}>or</span>
        <TextInput placeholder="Enter Code"></TextInput>
      </>
    </Stack>
  );
}
