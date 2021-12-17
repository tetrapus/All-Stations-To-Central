import arrayShuffle from "array-shuffle";
import { Flex } from "atoms/Flex";
import { Game, Player } from "data/Game";
import { doc, serverTimestamp } from "firebase/firestore";
import { docRef, collectionRef } from "init/firebase";
import React from "react";
import { fillRepeats } from "util/citygen";
import { getCardCounts } from "util/get-card-counts";
import { isCurrentPlayer } from "util/is-current-player";
import { runPlayerAction } from "util/run-game-action";
import { LocomotiveCard } from "./LocomotiveCard";
import { RouteCard } from "./RouteCard";

interface Props {
  me: Player;
  game: Game;
}

export function CardBar({ me, game }: Props) {
  if (!game.map) {
    return null;
  }

  return (
    <Flex>
      <Flex css={{ marginRight: "auto" }}>
        {me
          ? getCardCounts(me)?.map(([card, count], idx) => (
              <LocomotiveCard
                key={idx}
                color={card}
                count={count}
              ></LocomotiveCard>
            ))
          : null}
      </Flex>
      {game.boardState.carriages.faceUp?.map((card, idx) => (
        <LocomotiveCard
          key={idx}
          color={card.color}
          clickable={
            (game.turnState === "choose" || game.turnState === "drawn") &&
            game.isReady &&
            isCurrentPlayer(game, me)
          }
          onClick={() => {
            runPlayerAction(game, me, async ({ game, me, transaction }) => {
              if (
                isCurrentPlayer(game, me) &&
                (game?.turnState === "choose" || game?.turnState === "drawn")
              ) {
                const newCard = game.boardState.carriages.deck.pop();
                if (!newCard) {
                  throw new Error("Game state broken");
                }
                if (!game.boardState.carriages.deck.length) {
                  game.boardState.carriages.deck =
                    game.boardState.carriages.discard;
                  if (!game.boardState.carriages.deck.length && game.map) {
                    game.boardState.carriages.deck = fillRepeats(
                      game?.map.deck,
                      (color) => ({ color })
                    );
                  }
                  game.boardState.carriages.discard = [];
                }
                game.boardState.carriages.faceUp.splice(idx, 1, newCard);
                // TODO: Rainbow Refresh rule
                // TODO: Cannot draw rainbow on 'drawn' phase rule
                const newTurn =
                  game.turnState === "drawn" || card.color === "rainbow";
                transaction.update(docRef("games", game.id), {
                  "boardState.carriages.deck": game.boardState.carriages.deck,
                  "boardState.carriages.discard":
                    game.boardState.carriages.discard,
                  "boardState.carriages.faceUp":
                    game.boardState.carriages.faceUp,
                  turn: newTurn ? game.turn + 1 : game.turn,
                  turnState: newTurn ? "choose" : "drawn",
                });
                transaction.update(
                  docRef("games", game.id, "players", me.name),
                  {
                    hand: [...me.hand, card],
                  }
                );
                await transaction.set(
                  doc(collectionRef("games", game.id, "events")),
                  {
                    author: me.name,
                    timestamp: serverTimestamp(),
                    message: `${me.name} drew a card`,
                  }
                );
              }
            });
          }}
        ></LocomotiveCard>
      ))}
      <LocomotiveCard
        count={game.boardState.carriages.deck.length}
        clickable={
          (game.turnState === "choose" || game.turnState === "drawn") &&
          game.isReady &&
          isCurrentPlayer(game, me)
        }
        onClick={() => {
          runPlayerAction(game, me, async ({ game, me, transaction }) => {
            if (
              isCurrentPlayer(game, me) &&
              (game.turnState === "choose" || game.turnState === "drawn")
            ) {
              const newCard = game.boardState.carriages.deck.pop();
              if (!newCard) {
                throw new Error("Game state broken");
              }
              if (!game.boardState.carriages.deck.length) {
                game.boardState.carriages.deck =
                  game.boardState.carriages.discard;
                if (!game.boardState.carriages.deck.length && game.map) {
                  game.boardState.carriages.deck = fillRepeats(
                    game?.map.deck,
                    (color) => ({ color })
                  );
                }
                game.boardState.carriages.discard = [];
              }
              const newTurn = game.turnState === "drawn";
              transaction.update(docRef("games", game.id), {
                "boardState.carriages.deck": game.boardState.carriages.deck,
                "boardState.carriages.discard":
                  game.boardState.carriages.discard,
                turn: newTurn ? game.turn + 1 : game.turn,
                turnState: newTurn ? "choose" : "drawn",
              });
              transaction.update(docRef("games", game.id, "players", me.name), {
                hand: [...me.hand, newCard],
              });
              await transaction.set(
                doc(collectionRef("games", game.id, "events")),
                {
                  author: me.name,
                  timestamp: serverTimestamp(),
                  message: `${me.name} drew a card`,
                }
              );
            }
          });
        }}
      ></LocomotiveCard>
      <RouteCard
        count={game.boardState.routes.deck.length}
        clickable={isCurrentPlayer(game, me) && game.turnState === "choose"}
        map={game.map}
        onClick={() => {
          runPlayerAction(game, me, async ({ game, me, transaction }) => {
            if (isCurrentPlayer(game, me) && game.turnState !== "choose") {
              if (game.boardState.routes.deck.length <= 3) {
                game.boardState.routes.deck = [
                  ...game.boardState.routes.deck,
                  ...arrayShuffle(game.boardState.routes.discard),
                ];
                game.boardState.routes.discard = [];
              }
              await transaction.update(
                docRef("games", game.id, "players", me.name),
                {
                  "routeChoices.routes": [
                    game.boardState.routes.deck.pop(),
                    game.boardState.routes.deck.pop(),
                    game.boardState.routes.deck.pop(),
                  ],
                  "routeChoices.keepMin": 1,
                }
              );
              await transaction.update(docRef("games", game.id), {
                "boardState.routes.deck": game.boardState.routes.deck,
                "boardState.routes.discard": game.boardState.routes.discard,
                turnState: "routes-taken",
              });
              await transaction.set(
                doc(collectionRef("games", game.id, "events")),
                {
                  author: me.name,
                  timestamp: serverTimestamp(),
                  message: `${me.name} took 3 routes`,
                }
              );
            }
          });
        }}
      />
    </Flex>
  );
}
