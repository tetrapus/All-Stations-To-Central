import styled from "@emotion/styled";
import { Flex } from "atoms/Flex";
import { CELL_SIZE } from "data/Board";
import { Line, Destination, Game, Player, trainColors } from "data/Game";
import { doc, serverTimestamp } from "firebase/firestore";
import { dijkstra } from "graphology-shortest-path";
import { docRef, collectionRef } from "init/firebase";
import React from "react";
import { fillRepeats } from "util/citygen";
import { getCardCounts } from "util/get-card-counts";
import { indexBy } from "util/index-by";
import { isCurrentPlayer } from "util/is-current-player";
import { getMapGraph, getOwnedLines } from "util/lines";
import { distance } from "util/mapgen";
import { runPlayerAction } from "util/run-game-action";
import { sortBy } from "util/sort-by";

const Locomotive = styled(Flex)<{
  color: string;
  ownerColor: string;
  line: Line;
  idx: number;
}>(
  {
    borderImageSlice: 1,
    borderWidth: 2,
    borderStyle: "solid",
    margin: "0px 4px 0px 4px",
    flexGrow: 1,
    height: 10,
    position: "relative",
    top: -4,
  },
  ({ color, ownerColor, line, idx }) => ({
    borderColor: color,
    borderImage: color,
    background: ownerColor,
    transform: `translateY(${
      (10 * line.length) / 2 -
      Math.abs((idx + 0.5 - Math.ceil(line.length / 2)) / line.length) *
        (10 * line.length)
    }px) rotate(${-((idx + 0.5 - line.length / 2) / line.length) * 40}deg)`,
  })
);

const TrainLineContainer = styled(Flex)<{
  line: Line;
  colorIdx: number;
  playable: boolean;
  hintColor?: string;
  destinations: Destination[];
}>(
  {
    position: "absolute",
    transformOrigin: "top left",
    height: 4,
    "--hovercolor": "rgba(0,0,0,0.2)",
  },
  ({ line, destinations, colorIdx, playable, hintColor }) => {
    const citydex = indexBy(destinations, "name");
    const start = citydex[line.start];
    const end = citydex[line.end];
    return {
      left: CELL_SIZE * start.position.x,
      top: CELL_SIZE * start.position.y,
      transform: `rotate(${
        Math.atan2(
          end.position.y - start.position.y,
          end.position.x - start.position.x
        ) *
        (180 / Math.PI)
      }deg) translateY(-50%) translateY(${
        line.color.length > 1 ? (colorIdx - 0.5) * 16 : 0
      }px)`,
      width: distance(start, end) * CELL_SIZE,
      ":hover": {
        "--hovercolor": playable ? hintColor : undefined,
        cursor: playable ? "pointer" : undefined,
      },
    };
  }
);

export function TrainLine({
  game,
  line,
  lineNo,
  color,
  colorIdx,
  me,
  playerColors,
}: {
  game: Game;
  me?: Player;
  playerColors: { [name: string]: string };
  line: Line;
  lineNo: number;
  color: string;
  colorIdx: number;
}) {
  const map = game.map;
  const start = map.destinations.find(
    (destination) => line.start === destination.name
  );
  const end = map.destinations.find(
    (destination) => line.end === destination.name
  );
  if (!start || !end) return null;
  const owner = game.boardState.lines[lineNo]?.[0];
  const playable = (game: Game, me: Player) => {
    const counts = Object.fromEntries(getCardCounts(me));
    return (
      game.turnState === "choose" &&
      isCurrentPlayer(game, me) &&
      !owner &&
      line.length <= me.trainCount &&
      (color === "rainbow"
        ? Math.max(...Object.values({ ...counts, rainbow: 0 }))
        : counts[color] || 0) +
        (counts["rainbow"] || 0) >=
        line.length
    );
  };
  return (
    <TrainLineContainer
      line={line}
      colorIdx={colorIdx}
      playable={!!(me && playable(game, me))}
      hintColor={me?.color}
      destinations={map.destinations}
      key={lineNo * 2 + colorIdx}
      onClick={() => {
        if (!me) {
          return;
        }
        runPlayerAction(game, me, async ({ game, me, transaction }) => {
          if (game.map && playable(game, me) && game.isReady) {
            const counts = Object.fromEntries(getCardCounts(me));
            const useColor =
              line.color[colorIdx] === "rainbow"
                ? sortBy(Object.entries(counts), (e) => e[1])[0][0] ||
                  line.color[colorIdx]
                : line.color[colorIdx];
            const coreUsed = Math.min(line.length, counts[useColor]);
            const rainbowsUsed = line.length - coreUsed;
            const discard = [
              ...Array(coreUsed).fill({ color: useColor }),
              ...Array(rainbowsUsed).fill({ color: "rainbow" }),
            ];

            await transaction.update(docRef("games", game.id), {
              [`boardState.lines.${lineNo}.${colorIdx}`]: me.name,
              "boardState.carriages.discard": [
                ...game.boardState.carriages.discard,
                ...discard,
              ],
              turn: game.turn + 1,
              turnState: "choose",
            });
            if (me.trainCount - line.length <= 0) {
              // Final turn triggered!!!
              await transaction.update(docRef("games", game.id), {
                finalTurn: game.turn + game.playerCount - 1,
              });
            }
            // Update any won routes
            const graph = getMapGraph(game.map);
            const ownedLines = getOwnedLines(me, game);
            graph.addEdge(line.start, line.end);

            ownedLines.forEach((line) => graph.addEdge(line.start, line.end));
            const routes = me.routes.map((route) => ({
              ...route,
              won:
                route.won ||
                !!dijkstra.bidirectional(graph, route.start, route.end),
            }));
            await transaction.update(
              docRef("games", game.id, "players", me.name),
              {
                trainCount: me.trainCount - line.length,
                hand: fillRepeats(
                  {
                    ...counts,
                    [useColor]: (counts[useColor] || 0) - coreUsed,
                    rainbow: (counts["rainbow"] || 0) - rainbowsUsed,
                  },
                  (color) => ({ color })
                ),
                routes: routes,
              }
            );
            await transaction.set(
              doc(collectionRef("games", game.id, "events")),
              {
                author: me.name,
                timestamp: serverTimestamp(),
                message: `${me.name} claimed ${line.start} to ${line.end}`,
              }
            );
          }
        });
      }}
    >
      <Flex
        css={{
          width: "100%",
          paddingLeft: 12,
          paddingRight: 12,
        }}
      >
        {new Array(line.length).fill(0).map((_, idx) => (
          <Locomotive
            key={idx}
            color={trainColors[color]}
            ownerColor={
              game.boardState.lines[lineNo]?.[colorIdx]
                ? playerColors[game.boardState.lines[lineNo]?.[colorIdx]]
                : "var(--hovercolor)"
            }
            line={line}
            idx={idx}
          ></Locomotive>
        ))}
      </Flex>
    </TrainLineContainer>
  );
}
