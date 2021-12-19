import styled from "@emotion/styled";
import { Player } from "data/Game";
import React from "react";
import { PLAYER_ICONS } from "data/PlayerIcons";
interface Props {
  player: Player;
}

const PlayerColorBox = styled.div<Props>(
  {
    height: 16,
    width: 16,
    border: "1px solid black",
    margin: "4px 8px",
  },
  ({ player }) => ({ background: player.color })
);

export const PlayerSymbol = styled.div<Props>(
  {
    backgroundSize: "contain",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",

    width: "100%",
    height: "100%",
    opacity: 0.8,
    filter: "invert(1)",
  },
  ({ player }) => ({
    backgroundImage: PLAYER_ICONS[player.order % PLAYER_ICONS.length],
  })
);

export function PlayerColor({ player }: Props) {
  return (
    <PlayerColorBox player={player}>
      <PlayerSymbol player={player} />
    </PlayerColorBox>
  );
}
