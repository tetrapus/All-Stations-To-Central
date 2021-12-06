import React from "react";
import { WaitingRoom } from "./WaitingRoom";
import { Link, useParams } from "react-router-dom";
import {
  useCollectionData,
  useDocumentData,
} from "react-firebase-hooks/firestore";
import { Stack } from "atoms/Stack";
import { Flex } from "atoms/Flex";
import { collectionRef, docRef } from "init/firebase";
import { GameConverter, PlayerConverter } from "data/Game";
import { TextButton } from "atoms/TextButton";

export function GameInterface() {
  const { id } = useParams<{ id: string }>();

  const [game, gameLoading] = useDocumentData(
    docRef("games", id).withConverter(GameConverter)
  ); // todo: error

  const [players, playersLoading] = useCollectionData(
    collectionRef("games", id, "players").withConverter(PlayerConverter)
  ); // todo: loading

  if (playersLoading || gameLoading) {
    return null;
  }

  if (!game) {
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
    <Stack>
      <Flex>
        {id} {game?.map}{" "}
        {players?.map((player) => (
          <Flex key={player.name}>{player.name}</Flex>
        ))}
      </Flex>
      <WaitingRoom players={players} />
    </Stack>
  );
}
