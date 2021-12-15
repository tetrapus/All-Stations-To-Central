import { Player } from "data/Game";
import React from "react";
interface Props {
  player: Player;
}

export function PlayerColor({ player }: Props) {
  return (
    <div
      css={{
        height: 16,
        width: 16,
        border: "1px solid black",
        margin: "4px 8px",
      }}
      style={{ background: player.color }}
    ></div>
  );
}
