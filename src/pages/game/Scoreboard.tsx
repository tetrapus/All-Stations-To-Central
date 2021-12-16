import { Flex } from "atoms/Flex";
import { Stack } from "atoms/Stack";
import { Destination, Player } from "data/Game";
import React from "react";
import { sortBy } from "../../util/sort-by";
import { LineLengthIcon } from "./LineLengthIcon";
import { PlayerColor } from "./PlayerColor";
import { RouteCard } from "./RouteCard";

interface Props {
  players: Player[];
  destinations: { [name: string]: Destination };
}

export function Scoreboard({ players, destinations }: Props) {
  const rankings = sortBy(
    players.filter((player) => player.scores),
    (p) => p.scores?.total || 0
  );
  return (
    <Stack css={{ padding: "16px 32px" }}>
      <Stack css={{ margin: "auto" }}>
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
                    {[...Array(Math.ceil(lines.length / 3)).keys()].map(
                      (group) => (
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
                      )
                    )}
                  </td>
                  <td css={{ padding: "8px 16px" }}>
                    <Flex>
                      {player.routes.map((route, idx) => (
                        <RouteCard
                          route={route}
                          destinations={destinations}
                          count={player.scores?.routes[idx]}
                        ></RouteCard>
                      ))}
                    </Flex>
                  </td>
                </tr>
              );
            })}
          </table>
        </Stack>
      </Stack>
    </Stack>
  );
}
