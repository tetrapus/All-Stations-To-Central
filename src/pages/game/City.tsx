import React from "react";
import { Destination, Game, Player } from "data/Game";
import { Flex } from "atoms/Flex";
import { CELL_SIZE } from "data/Board";
import styled from "@emotion/styled";
import { PlayerSymbol } from "./PlayerColor";
import { keyframes } from "@emotion/core";

interface Props {
  game: Game;
  me?: Player;
  stationOwner?: Player;
  stationActive: boolean;
  destination: Destination;
  isHighlighted: boolean;
  isAdjacent: boolean;
  isSelected: boolean;
  onLineSelected(): void;
}

const whitePulse = keyframes`
	0% {
  box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7);
}

70% {
  box-shadow: 0 0 0 10px rgba(255, 255, 255, 0);
}

100% {
  box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
}`;

const CityNode = styled.div<{
  clickable: boolean;
  owner?: Player;
  stationActive: boolean;
}>(
  {
    borderRadius: 12,
    width: 22,
    height: 22,
    border: "1px solid black",
  },
  ({ clickable, owner, stationActive }) => ({
    background: owner
      ? owner.color
      : "radial-gradient(circle, rgba(255,233,0,1) 0%, rgba(255,79,0,1) 100%)",
    cursor: clickable ? "pointer" : undefined,
    opacity: stationActive ? 1 : 0.4,
  })
);

const CityContainer = styled(Flex)<{
  destination: Destination;
}>(
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

const CityRing = styled.div<{
  isHighlighted: boolean;
  isSelected: boolean;
  isAdjacent: boolean;
}>(
  {
    borderRadius: 15,
    width: 24,
    height: 24,
    position: "relative",
    transform: "translateX(-50%)",

    boxShadow: "0 0 0 0 rgba(255, 255, 255, 1)",
  },
  ({ isHighlighted, isSelected, isAdjacent }) => ({
    border:
      isHighlighted || isAdjacent
        ? "3px solid lightgreen"
        : isSelected
        ? "3px solid white"
        : undefined,
    animation:
      isHighlighted || isSelected || isAdjacent
        ? `${whitePulse} 2s infinite`
        : undefined,
  })
);

export function City({
  game,
  me,
  destination,
  isHighlighted,
  isAdjacent,
  stationOwner,
  stationActive,
  isSelected,
  onLineSelected,
}: Props) {
  return (
    <CityContainer destination={destination}>
      <CityRing
        isHighlighted={isHighlighted}
        isSelected={isSelected}
        isAdjacent={isAdjacent}
      >
        <CityNode
          owner={stationOwner}
          stationActive={stationActive}
          onClick={() => {
            if (
              (me &&
                game.isReady &&
                ((stationOwner && stationOwner.name === me.name) ||
                  (!stationOwner && me.stationCount))) ||
              isAdjacent
            ) {
              onLineSelected();
            }
          }}
          clickable={
            !!(
              (me &&
                game.isReady &&
                ((stationOwner && stationOwner.name === me.name) ||
                  (!stationOwner && me.stationCount))) ||
              isAdjacent
            )
          }
        >
          {stationOwner && <PlayerSymbol player={stationOwner} />}
        </CityNode>
      </CityRing>
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
