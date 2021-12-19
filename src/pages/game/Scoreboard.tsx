import { Flex } from "atoms/Flex";
import { Stack } from "atoms/Stack";
import { Game, Player } from "data/Game";
import React from "react";
import { sortBy } from "../../util/sort-by";
import { LineLengthIcon } from "./LineLengthIcon";
import { PlayerColor } from "./PlayerColor";
import { RouteCard } from "./RouteCard";
import { TextButton } from "atoms/TextButton";
import { runGameAction } from "util/run-game-action";
import { dijkstra } from "graphology-shortest-path";
import { docRef } from "init/firebase";
import { getMapGraph, getOwnedLines } from "util/lines";
import { range } from "util/range";

interface Props {
  players: Player[];
  game: Game;
}

export function Scoreboard({ players, game }: Props) {
  const rankings = sortBy(
    players.filter((player) => player.scores),
    (p) => p.scores?.total || 0
  );

  const map = game.map;

  if (!map) {
    return null;
  }

  return (
    <Stack css={{ padding: "16px 32px" }}>
      <Stack css={{ margin: "auto" }}>
        {game.scored ? (
          <>
            <h1>Scores</h1>
            <Stack>
              <table css={{ borderCollapse: "collapse" }}>
                {rankings.map((player, rank) => {
                  if (!player.scores) {
                    return null;
                  }
                  const lines = sortBy(
                    Object.entries(player.scores.lines),
                    (lineEntry) => Number(lineEntry[0])
                  );
                  return (
                    <tr css={{ borderBottom: "1px solid grey" }}>
                      <td
                        css={{
                          fontSize: 32,
                          textAlign: "right",
                          padding: "8px 16px",
                        }}
                      >
                        {player.scores.total}
                      </td>{" "}
                      <td css={{ padding: "8px 0 8px 16px" }}>
                        <PlayerColor player={player} />
                      </td>
                      <td css={{ padding: "8px 16px 8px 0" }}>{player.name}</td>
                      <td css={{ padding: "8px 16px" }}>
                        {range(Math.ceil(lines.length / 3)).map((group) => (
                          <Stack>
                            {lines
                              .slice(group * 3, group * 3 + 3)
                              .map(([lineCount, number]) => (
                                <Flex css={{ alignItems: "center" }}>
                                  <span css={{ margin: "0 4px" }}>
                                    {number} x
                                  </span>
                                  <LineLengthIcon
                                    color={player.color}
                                    length={Number(lineCount)}
                                  />{" "}
                                </Flex>
                              ))}
                          </Stack>
                        ))}
                      </td>
                      <td css={{ padding: "8px 16px" }}>
                        <Flex>
                          {player.routes.map((route, idx) => (
                            <RouteCard
                              route={route}
                              count={player.scores?.routes[idx]}
                              map={map}
                            ></RouteCard>
                          ))}
                        </Flex>
                      </td>
                    </tr>
                  );
                })}
              </table>
            </Stack>
          </>
        ) : (
          <>
            <h1>Game Over!</h1>
            <TextButton
              onClick={() => {
                runGameAction(game, async ({ game, transaction }) => {
                  if (
                    game.finalTurn &&
                    game.turn >= game.finalTurn &&
                    !game.scored
                  ) {
                    const graph = getMapGraph(map);

                    for (let i = 0; i < players.length; i++) {
                      const player = players[i];
                      const scores = {
                        routes: {} as { [key: number]: number },
                        lines: {} as { [key: number]: number },
                        bonuses: {},
                        stations: 0,
                        total: 0,
                      };
                      // Calculate lines score
                      const ownedLines = getOwnedLines(player, game);
                      // Go through and score each route
                      graph.clearEdges();
                      ownedLines.forEach((line) =>
                        graph.addEdge(line.start, line.end)
                      );
                      ownedLines.forEach((line) => {
                        if (scores.lines[line.length] === undefined) {
                          scores.lines[line.length] = 1;
                        } else {
                          scores.lines[line.length] += 1;
                        }
                        scores.total += map.scoringTable[line.length];
                      });
                      scores.routes = Object.fromEntries(
                        player.routes.map((route, idx) => [
                          idx,
                          dijkstra.bidirectional(graph, route.start, route.end)
                            ? route.points
                            : -route.points,
                        ])
                      );
                      scores.total += Object.values(scores.routes).reduce(
                        (a, b) => a + b,
                        0
                      );
                      // TODO: Bonuses
                      // Save scores
                      transaction.update(
                        docRef("games", game.id, "players", player.name),
                        {
                          scores,
                        }
                      );
                    }
                    transaction.update(docRef("games", game.id), {
                      scored: true,
                    });
                  }
                });
              }}
            >
              Calculate Scores
            </TextButton>
          </>
        )}
      </Stack>
    </Stack>
  );
}
