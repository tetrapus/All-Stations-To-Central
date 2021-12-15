import { Flex } from "atoms/Flex";
import { Stack } from "atoms/Stack";
import React from "react";

interface Props {
  color: string;
  length: number;
}

export function LineLengthIcon({ color, length }: Props) {
  const rows = 4;
  return (
    <Stack css={{ marginRight: "auto" }}>
      {[...Array(Math.ceil(length / rows)).keys()].map((divisor) => (
        <Flex>
          {[
            ...Array(
              (divisor + 1) * rows > length ? length % rows : rows
            ).keys(),
          ].map(() => (
            <div
              css={{ height: 6, background: color, width: 16, margin: 1 }}
            ></div>
          ))}
        </Flex>
      ))}
    </Stack>
  );
}
