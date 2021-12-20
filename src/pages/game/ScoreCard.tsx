import { Breakpoint } from "atoms/Breakpoint";
import { Flex } from "atoms/Flex";
import { Stack } from "atoms/Stack";
import { GameMap } from "data/Game";
import React from "react";
import { range } from "util/range";
import { LineLengthIcon } from "./LineLengthIcon";

interface Props {
  map: GameMap;
}

export function ScoreCard({ map }: Props) {
  const scores = Object.entries(map.scoringTable);
  return (
    <Stack
      css={{
        background: "white",
        borderRadius: 2,
        border: "1px solid black",
        padding: "2px 4px",
        [Breakpoint.MOBILE]: {
          display: "none",
        },
      }}
    >
      <strong css={{ marginLeft: "auto", fontSize: 14 }}>Points</strong>
      <Flex>
        {range(Math.ceil(scores.length / 2)).map((group) => (
          <Stack>
            {scores.slice(group * 3, group * 3 + 3).map(([length, score]) => (
              <Flex css={{ alignItems: "center" }}>
                <LineLengthIcon
                  color={"black"}
                  length={Number(length)}
                ></LineLengthIcon>{" "}
                <span css={{ margin: "0 4px", fontSize: 12 }}>{score}</span>{" "}
              </Flex>
            ))}
          </Stack>
        ))}
      </Flex>
    </Stack>
  );
}
