import React from "react";
import { Destination } from "data/Game";
import { Flex } from "atoms/Flex";
import { CELL_SIZE } from "data/Board";

interface Props {
  destination: Destination;
  isHighlighted: boolean;
}

export function City({ destination, isHighlighted }: Props) {
  return (
    <Flex
      css={{
        left: CELL_SIZE * destination.position.x,
        position: "absolute",
        top: CELL_SIZE * destination.position.y,
        color: "white",
        transform: "translateY(-50%)",
      }}
    >
      <div
        css={{
          borderRadius: 12,
          width: 22,
          height: 22,
          border: "1px solid #FFD700",
          transform: "translateX(-50%)",
        }}
        style={{
          background: isHighlighted
            ? "radial-gradient(circle, green 0%, lightgreen 100%)"
            : "radial-gradient(circle, rgba(255,233,0,1) 0%, rgba(255,79,0,1) 100%)",
        }}
      ></div>
      <div
        css={{
          background: "rgba(0, 0, 0, 0.5)",
          fontSize: 11,
          padding: "2px",
          transform: "translateX(-8px)",
          margin: "auto",
        }}
      >
        {destination.name}
      </div>
    </Flex>
  );
}
