import React, { useState } from "react";
import { Game, Player, Route } from "data/Game";
import { TextButton } from "atoms/TextButton";
import { doc, serverTimestamp, deleteField } from "firebase/firestore";
import { dijkstra } from "graphology-shortest-path";
import { docRef, collectionRef } from "init/firebase";
import { RouteCard } from "./RouteCard";
import { getMapGraph, getOwnedLines } from "util/lines";
import { runPlayerAction } from "util/run-game-action";

interface Props {
  routes: Route[];
  maxDiscard: number;
  game: Game;
  me: Player;
}

export const RouteChoices = ({ routes, maxDiscard, game, me }: Props) => {
  const [chosen, setChosen] = useState<number[]>([]);

  const map = game.map;
  if (!map) {
    return null;
  }

  return (
    <>
      {routes.map((route, idx) => (
        <div
          onClick={() => {
            if (chosen.includes(idx)) {
              setChosen(chosen.filter((x) => x !== idx));
            } else if (chosen.length < maxDiscard) {
              setChosen([...chosen, idx]);
            }
          }}
          css={
            chosen.includes(idx) ? { fontStyle: "italic", opacity: 0.5 } : {}
          }
        >
          <RouteCard route={route} count={route.points} key={idx} map={map} />
        </div>
      ))}
      <TextButton
        css={{ fontSize: 14 }}
        onClick={() => {
          runPlayerAction(game, me, async ({ game, me, transaction }) => {
            if (!game.map) {
              return;
            }

            const graph = getMapGraph(game.map);
            const ownedLines = getOwnedLines(me, game);

            ownedLines.forEach((line) => graph.addEdge(line.start, line.end));
            const newRoutes = routes.map((route) => ({
              ...route,
              won:
                route.won ||
                !!dijkstra.bidirectional(graph, route.start, route.end),
            }));

            await transaction.update(
              docRef("games", game.id, "players", me.name),
              {
                routeChoices: deleteField(),
                routes: [
                  ...newRoutes.filter((route, idx) => !chosen.includes(idx)),
                  ...me.routes,
                ],
                isReady: true,
              }
            );
            await transaction.update(docRef("games", game.id), {
              "boardState.routes.discard": [
                ...game.boardState.routes.discard,
                ...routes.filter((route, idx) => chosen.includes(idx)),
              ],
              turnState:
                game.turnState === "routes-taken" ? "choose" : game.turnState,
              turn:
                game.turnState === "routes-taken" ? game.turn + 1 : game.turn,
              readyCount: game.readyCount + 1,
              isReady:
                game.isStarted && game.readyCount + 1 >= game.playerCount,
            });
            await transaction.set(
              doc(collectionRef("games", game.id, "events")),
              {
                author: me.name,
                timestamp: serverTimestamp(),
                message: `${me.name} chose their routes`,
              }
            );
          });
        }}
      >
        Discard {chosen.length}
      </TextButton>
    </>
  );
};
