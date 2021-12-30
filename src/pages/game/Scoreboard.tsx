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
import { docRef } from "init/firebase";
import { nOf } from "util/n-of";
import { updateRouteStates } from "../../util/update-route-states";
import { LocomotiveCard } from "./LocomotiveCard";
import { EngineContext, useEngine } from "../../util/game-engine";

function getBonusWinners(bonusType: string, game: Game, players: Player[]) {
  console.log(bonusType);
  switch (bonusType) {
    case "globetrotter":
      const results = sortBy(
        players.map((player): [number, number] => [
          player.order,
          player.routes.filter((route) => route.won).length,
        ]),
        ([, wonCount]) => wonCount
      );
      const resultMap = Object.fromEntries(results);
      console.log(results, resultMap);
      return players.filter(
        (player) => resultMap[player.order] === results[0][1]
      );

    default:
      return [];
  }
}

export function Scoreboard() {
  const engine = useEngine(EngineContext);
  const { game, players } = engine.getState();
  const rankings = sortBy(
    players.filter((player) => player.scores),
    (p) => p.scores?.total || 0
  );

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
                        {nOf(Math.ceil(lines.length / 3), (group) => (
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
                      <td>
                        {Object.entries(player.scores.bonuses).map(
                          ([bonusNo, score]) => (
                            <Stack>
                              <div css={{ margin: "auto" }}>
                                <LocomotiveCard count={score}></LocomotiveCard>
                              </div>
                              <div css={{ fontSize: 12, fontWeight: "bold" }}>
                                {game.map.bonuses[Number(bonusNo)].name}
                              </div>
                            </Stack>
                          )
                        )}
                      </td>
                      <td css={{ padding: "8px 16px" }}>
                        <Flex>
                          {player.routes.map((route, idx) => (
                            <RouteCard
                              route={route}
                              count={player.scores?.routes[idx]}
                              map={game.map}
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
                    const bonusWinners = game.map.bonuses.map((bonus) =>
                      getBonusWinners(bonus.type, game, players)
                    );

                    console.log(bonusWinners);

                    for (let i = 0; i < players.length; i++) {
                      const player = players[i];
                      const scores = {
                        routes: {} as { [key: number]: number },
                        lines: {} as { [key: number]: number },
                        bonuses: Object.fromEntries(
                          bonusWinners
                            .map((winners, idx) => [
                              idx,
                              winners.find((p) => p.order === player.order)
                                ? game.map.bonuses[idx].points
                                : undefined,
                            ])
                            .filter(([, score]) => score !== undefined)
                        ) as { [key: number]: number },
                        stations: 4 * player.stationCount,
                        total: 4 * player.stationCount,
                      };

                      scores.total += Object.values(scores.bonuses).reduce(
                        (a, b) => a + b,
                        0
                      );

                      const { ownedLines } = updateRouteStates(game, player);

                      // Go through and score each route
                      ownedLines.forEach((line) => {
                        if (scores.lines[line.length] === undefined) {
                          scores.lines[line.length] = 1;
                        } else {
                          scores.lines[line.length] += 1;
                        }
                        scores.total += game.map.scoringTable[line.length];
                      });
                      scores.routes = Object.fromEntries(
                        player.routes.map((route, idx) => [
                          idx,
                          route.won ? route.points : -route.points,
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
