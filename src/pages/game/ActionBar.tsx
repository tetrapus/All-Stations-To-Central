import { Flex } from "atoms/Flex";
import { TextButton } from "atoms/TextButton";
import { Game, Player } from "data/Game";
import { FieldValue } from "firebase/firestore";
import { docRef } from "init/firebase";
import React from "react";
import { PlayerEngineContext, useEngine } from "util/game-engine";
import { getNextTurn } from "util/next-turn";
import { runPlayerAction, runGameAction } from "util/run-game-action";

export function ActionBar() {
  const engine = useEngine(PlayerEngineContext);
  const { game, me } = engine.getState();

  if (
    !game.isStarted ||
    (game.finalTurn && game.finalTurn < game.turn) ||
    game.removedPlayers.includes(me.order)
  ) {
    return null;
  }

  return (
    <Flex css={{ margin: "8px 4px" }}>
      <TextButton
        css={{ fontSize: 14, margin: "auto" }}
        onClick={() => {
          runPlayerAction(game, me, async ({ game, me, transaction }) => {
            if (game.removedPlayers.includes(me.order)) {
              return;
            }
            let gameUpdates: Partial<
              Omit<Game, "turnStart"> & { turnStart: FieldValue }
            > & { removedPlayers: number[] } = {
              removedPlayers: [...game.removedPlayers, me.order],
            };
            let playerUpdates: Partial<Player> = {};
            // Am I ready?
            if (!me.isReady) {
              gameUpdates.readyCount = game.readyCount + 1;
              playerUpdates.isReady = true;
            }
            // Is it my turn?
            if (game.turn % game.playerCount === me.order) {
              gameUpdates = {
                ...gameUpdates,
                ...getNextTurn(game, true),
              };
            }
            // Am I the last player?
            if (gameUpdates.removedPlayers.length >= game.playerCount) {
              gameUpdates.finalTurn = game.turn - 1;
            }
            await transaction.update(docRef("games", game.id), gameUpdates);
            await transaction.update(
              docRef("games", game.id, "players", me.name),
              playerUpdates
            );
          });
        }}
      >
        Leave
      </TextButton>
      <TextButton
        css={{ fontSize: 14, margin: "auto" }}
        onClick={() => {
          runGameAction(game, async ({ game, transaction }) => {
            transaction.update(docRef("games", game.id), {
              finalTurn: game.turn - 1,
              isReady: true,
            });
          });
        }}
      >
        End Game
      </TextButton>
    </Flex>
  );
}
