import { Flex } from "atoms/Flex";
import { TrainColor, trainColors, trainPatterns } from "data/Game";
import React from "react";

interface Props {
  color?: TrainColor;
  count?: number;
  clickable?: boolean;
  onClick?: () => void;
}

export const LocomotiveCard = ({ color, count, clickable, onClick }: Props) => (
  <div
    css={{
      height: 64,
      width: 48,
      margin: 4,
      borderRadius: 3,
      border: "1px solid #999",
      background: color ? trainColors[color] : "white",
      cursor: clickable ? "pointer" : undefined,
    }}
    onClick={onClick}
  >
    <Flex
      css={{
        width: "100%",
        height: "100%",
        background: color ? trainPatterns(0.5)[color] : undefined,
      }}
    >
      <div css={{ fontSize: 24, fontWeight: "bold", margin: "auto" }}>
        {count}
      </div>
    </Flex>
  </div>
);
