import { TrainColor, trainColors } from "data/Game";
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
      display: "flex",
      borderRadius: 3,
      border: "1px solid #999",
      background: color ? trainColors[color] : "white",
      cursor: clickable ? "pointer" : undefined,
    }}
    onClick={onClick}
  >
    <div css={{ fontSize: 24, fontWeight: "bold", margin: "auto" }}>
      {count}
    </div>
  </div>
);
