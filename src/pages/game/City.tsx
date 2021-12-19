import React from "react";
import { Destination } from "data/Game";
import { Flex } from "atoms/Flex";
import { CELL_SIZE } from "data/Board";
import styled from "@emotion/styled";

interface Props {
  destination: Destination;
  isHighlighted: boolean;
  isSelected: boolean;
}

const CityNode = styled.div<{ isHighlighted: boolean; isSelected: boolean }>(
  {
    borderRadius: 12,
    width: 22,
    height: 22,
    border: "1px solid #FFD700",
    transform: "translateX(-50%)",
  },
  ({ isHighlighted, isSelected }) => ({
    background: isHighlighted
      ? "radial-gradient(circle, green 0%, lightgreen 100%)"
      : isSelected
      ? "#aaa"
      : "radial-gradient(circle, rgba(255,233,0,1) 0%, rgba(255,79,0,1) 100%)",
    borderColor: isHighlighted || isSelected ? "white" : undefined,
  })
);

const CityContainer = styled(Flex)<{ destination: Destination }>(
  {
    position: "absolute",
    color: "white",
    transform: "translateY(-50%)",
  },
  ({ destination }) => ({
    top: CELL_SIZE * destination.position.y,
    left: CELL_SIZE * destination.position.x,
  })
);

export function City({ destination, isHighlighted, isSelected }: Props) {
  return (
    <CityContainer destination={destination}>
      <CityNode isHighlighted={isHighlighted} isSelected={isSelected} />
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
    </CityContainer>
  );
}
