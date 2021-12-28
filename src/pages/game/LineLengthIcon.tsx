import styled from "@emotion/styled";
import { Flex } from "atoms/Flex";
import { Stack } from "atoms/Stack";
import React from "react";
import { nOf } from "util/n-of";

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
      {nOf(Math.ceil(length / rows), (divisor) => (
        <Flex key={divisor}>
          {nOf((divisor + 1) * rows > length ? length % rows : rows, (idx) => (
            <LocomotiveIcon color={color} key={idx} />
          ))}
        </Flex>
      ))}
    </Stack>
  );
}
