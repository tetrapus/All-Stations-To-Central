import useLocalStorage from "@rehooks/local-storage";
import React from "react";
import { useParams } from "react-router";
import { TextButton } from "atoms/TextButton";
import { deleteDoc, setDoc } from "@firebase/firestore";
import { Player } from "data/Game";
import { docRef } from "init/firebase";

interface Props {
  players: Player[] | undefined;
}

export function WaitingRoom({ players }: Props) {
  const [username] = useLocalStorage<string>("username");
  const { id } = useParams<{ id: string }>();

  if (!username || !players) {
    return null;
  }

  return (
    <>
      {" "}
      {players.find((player) => player.name === username) ? (
        <TextButton
          onClick={async (event) => {
            await deleteDoc(docRef("games", id, "players", username));
          }}
        >
          Leave Game
        </TextButton>
      ) : (
        <TextButton
          onClick={async (event) => {
            const player: Player = {
              name: username,
              order: 1,
              hand: [],
              routes: [],
              trainCount: 45,
              stationCount: 0,
            };
            await setDoc(docRef("games", id, "players", username), player);
          }}
        >
          Join Game
        </TextButton>
      )}
    </>
  );
}
