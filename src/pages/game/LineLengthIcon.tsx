import styled from "@emotion/styled";
import { Flex } from "atoms/Flex";
import { Stack } from "atoms/Stack";
import React from "react";
import { range } from "util/range";

interface Props {
  color: string;
  length: number;
}

const LocomotiveIcon = styled.div<{ color: string }>(
  { height: 4, width: 12, margin: 1 },
  ({ color }) => ({ background: color })
);

export function LineLengthIcon({ color, length }: Props) {
  const rows = 4;
  return (
    <Stack css={{ marginRight: "auto" }}>
      {range(Math.ceil(length / rows)).map((divisor) => (
        <Flex key={divisor}>
          {range((divisor + 1) * rows > length ? length % rows : rows).map(
            (idx) => (
              <LocomotiveIcon color={color} key={idx} />
            )
          )}
        </Flex>
      ))}
    </Stack>
  );
}
