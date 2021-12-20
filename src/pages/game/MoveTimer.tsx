import { Game, Player } from "data/Game";
import React, { useEffect, useState } from "react";
import { getNextTurn } from "../../util/next-turn";
import { runPlayerAction } from "util/run-game-action";
import { doc, serverTimestamp, Timestamp } from "firebase/firestore";
import { docRef, collectionRef } from "init/firebase";

interface Props {
  game: Game;
  // Required to ensure atomicity
  me?: Player;
  playerNo: number;
}

export function MoveTimer({ game, me, playerNo }: Props) {
  useEffect(() => {
    if (game.turn > 1000) {
      return;
    }
    if (
      game &&
      game.moveTimer &&
      game.turnStart &&
      me &&
      playerNo === me.order &&
      game.turn % game.playerCount === me.order
    ) {
      const timeout = setTimeout(() => {
        runPlayerAction(
          game,
          me,
          async ({ game: newGame, me, transaction }) => {
            console.log("Running timeout", {
              timeout,
              gameTurn: game.turn,
              newTurn: newGame.turn,
            });
            if (
              newGame.turn % newGame.playerCount !== me.order ||
              newGame.turn !== game.turn
            ) {
              return; // stale data
            }
            await transaction.update(
              docRef("games", game.id),
              getNextTurn(game)
            );
            await transaction.set(
              doc(collectionRef("games", game.id, "events")),
              {
                author: me.name,
                timestamp: serverTimestamp(),
                message: `${me.name} ran out of time`,
              }
            );
          }
        );
      }, game.turnStart.toDate().getTime() + game.moveTimer * 1000 - Timestamp.now().toDate().getTime());
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [game, me, playerNo]);

  const [, setTime] = useState<number>(Date.now());
  useEffect(() => {
    const timeout = setInterval(() => {
      setTime(Date.now());
    }, 500);
    return () => clearInterval(timeout);
  }, []);

  if (
    !game ||
    !game.moveTimer ||
    !game.turnStart ||
    game.turn % game.playerCount !== playerNo
  ) {
    return null;
  }

  const remaining =
    (game.turnStart.toDate().getTime() +
      game.moveTimer * 1000 -
      Timestamp.now().toDate().getTime()) /
    1000;

  if (remaining <= 0) {
    return null;
  }

  return (
    <div
      css={{
        position: "absolute",
        top: 0,
        left: 2,
        fontSize: 12,
      }}
    >
      {Math.floor(remaining / 60)
        .toFixed(0)
        .padStart(2, "0")}
      :
      {Math.floor(remaining % 60)
        .toFixed(0)
        .padStart(2, "0")}
    </div>
  );
}
