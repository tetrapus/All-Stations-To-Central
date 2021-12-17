import styled from "@emotion/styled";
import { Flex } from "atoms/Flex";
import { Stack } from "atoms/Stack";
import React from "react";

interface Props {
  color: string;
  length: number;
}

const LocomotiveIcon = styled.div<{ color: string }>(
  { height: 6, width: 16, margin: 1 },
  ({ color }) => ({ background: color })
);

export function LineLengthIcon({ color, length }: Props) {
  const rows = 4;
  return (
    <Stack css={{ marginRight: "auto" }}>
      {[...Array(Math.ceil(length / rows)).keys()].map((divisor) => (
        <Flex key={divisor}>
          {[
            ...Array(
              (divisor + 1) * rows > length ? length % rows : rows
            ).keys(),
          ].map((idx) => (
            <LocomotiveIcon color={color} key={idx} />
          ))}
        </Flex>
      ))}
    </Stack>
  );
}
