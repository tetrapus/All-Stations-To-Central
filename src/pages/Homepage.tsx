import { Stack } from "atoms/Stack";
import React from "react";
import { TextButton } from "atoms/TextButton";
import { TextInput } from "atoms/TextInput";
import { useHistory } from "react-router";
import { useLocalStorage } from "@rehooks/local-storage";
import { runTransaction, Timestamp } from "@firebase/firestore";
import { docRef, db } from "init/firebase";
import { DEFAULT_MAP_SETTINGS, Game } from "data/Game";
import { Player } from "../data/Game";
import { generateColor } from "../util/colorgen";
import { generateMap } from "util/mapgen";
import { range } from "util/range";

const randomElement = (array: any[]) =>
  array[Math.floor(Math.random() * array.length)];

function generateCode() {
  return `${range(3)
    .map(() => randomElement([..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"]))
    .join("")}-${range(3)
    .map(() => randomElement([..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"]))
    .join("")}`;
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
            await runTransaction(db, async (transaction) => {
              const game: Game = {
                id: code,
                created: Timestamp.now(),
                isStarted: false,
                isReady: false,
                turn: 0,
                playerCount: 1,
                readyCount: 0,
                removedPlayers: [],
                moveTimer: 120,
                boardState: {
                  carriages: {
                    deck: [],
                    faceUp: [],
                    discard: [],
                  },
                  routes: {
                    deck: [],
                    discard: [],
                  },
                  lines: {},
                  stations: {},
                },
                map: generateMap(DEFAULT_MAP_SETTINGS),
              };
              await transaction.set(docRef("games", code), game);
              const players: Player[] = [
                {
                  name: username,
                  order: 0,
                  color: generateColor(),
                  hand: [],
                  routes: [],
                  trainCount: 45,
                  stationCount: 0,
                  isReady: false,
                },
              ];
              for (let i = 0; i < players.length; i++) {
                await transaction.set(
                  docRef("games", code, "players", players[i].name),
                  players[i]
                );
              }
            });
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
    </Stack>
  );
}
