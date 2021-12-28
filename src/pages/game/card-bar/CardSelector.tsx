import styled from "@emotion/styled";
import { Breakpoint } from "atoms/Breakpoint";
import { Flex } from "atoms/Flex";
import { ferryInsignia, trainColors, trainPatterns } from "data/Game";
import React from "react";
import { LocomotiveCard } from "../LocomotiveCard";

const CardSlotInner = styled(Flex)<{ isFerry: boolean }>({}, ({ isFerry }) => ({
  backgroundImage: isFerry ? ferryInsignia : undefined,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "center",
  width: "100%",
}));

const CardSlot = styled(Flex)<{
  color: string;
  isFerry: boolean;
}>(
  {
    height: 48,
    width: 32,
    margin: "auto",
    border: "2px solid",
    borderRadius: 2,
    borderStyle: "dashed",
    [Breakpoint.TABLET]: {
      height: 42,
      width: 28,
    },
  },
  ({ color, isFerry }) => ({
    borderColor: trainColors[color],
    borderImage: isFerry ? trainColors["rainbow"] : trainColors[color],
    borderImageSlice: 1,
    background: trainPatterns(0.3)[color],
  })
);

const CardSlotContainer = styled(Flex)<{ isForTunnel?: boolean }>(
  {
    height: 64,
    width: 48,
    margin: 5,
    borderRadius: 2,
    cursor: "pointer",
    [Breakpoint.TABLET]: {
      height: 52,
      width: 36,
    },
  },
  ({ isForTunnel }) => ({
    background: isForTunnel ? "#ccc" : "black",
  })
);

interface Props {
  color: string;
  selection?: string;
  isFerry: boolean;
  isForTunnel?: boolean;
  onClick(): void;
}

export const CardSelector = ({
  color,
  selection,
  isFerry,
  isForTunnel,
  onClick,
}: Props) => {
  if (selection) {
    return (
      <LocomotiveCard color={selection} onClick={onClick} clickable={true} />
    );
  }
  return (
    <CardSlotContainer isForTunnel={isForTunnel} onClick={onClick}>
      <CardSlot color={color} isFerry={isFerry}>
        <CardSlotInner isFerry={isFerry} />
      </CardSlot>
    </CardSlotContainer>
  );
};
