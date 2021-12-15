import { Flex } from "atoms/Flex";
import { Stack } from "atoms/Stack";
import { Map } from "data/Game";
import React from "react";
import { LineLengthIcon } from "./LineLengthIcon";

interface Props {
  map: Map;
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
      }}
    >
      <strong css={{ marginLeft: "auto" }}>Points</strong>
      <Flex>
        {[...Array(Math.ceil(scores.length / 2)).keys()].map((group) => (
          <Stack>
            {scores.slice(group * 3, group * 3 + 3).map(([length, score]) => (
              <Flex css={{ alignItems: "center" }}>
                <LineLengthIcon
                  color={"black"}
                  length={Number(length)}
                ></LineLengthIcon>{" "}
                <span css={{ margin: "0 4px" }}>{score}</span>{" "}
              </Flex>
            ))}
          </Stack>
        ))}
      </Flex>
    </Stack>
  );
}
