import useLocalStorage from "@rehooks/local-storage";
import { TextButton } from "atoms/TextButton";
import { GameConverter, PlayerConverter } from "data/Game";
import { query, orderBy } from "firebase/firestore";
import { collectionRef, docRef } from "init/firebase";
import React from "react";
import {
  useCollectionData,
  useDocumentData,
} from "react-firebase-hooks/firestore";
import { Link, useParams } from "react-router-dom";
import { GameInterface } from "./game/GameInterface";

export function GamePage() {
  const { id } = useParams<{ id: string }>();
  const [username] = useLocalStorage<string>("username");

  const [game, gameLoading] = useDocumentData(
    docRef("games", id).withConverter(GameConverter)
  ); // todo: error

  const [players, playersLoading] = useCollectionData(
    query(
      collectionRef("games", id, "players").withConverter(PlayerConverter),
      orderBy("order")
    )
  ); // todo: loading

  if (playersLoading || gameLoading) {
    return null;
  }

  if (!game || !players || !username) {
    return (
      <>
        Invalid game code!{" "}
        <Link to="/">
          <TextButton>Go Home</TextButton>
        </Link>
      </>
    );
  }

  return (
    <GameInterface game={game} players={players} username={username} id={id} />
  );
}
