import styled from "@emotion/styled";
import { Player } from "data/Game";
import React from "react";
import { PLAYER_ICONS } from "data/PlayerIcons";
import { range } from "util/range";
interface Props {
  player: Player;
}

const PlayerColorBox = styled.div<Props>(
  {
    height: 24,
    width: 24,
    border: "1px solid black",
    margin: "4px 8px 4px 0",
    borderRadius: 13,
    position: "relative",
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
      {range(player.stationCount).map((idx) => (
        <div
          css={{
            background: player.color,
            width: 5,
            height: 5,
            border: "1px solid #555",
            borderRadius: 3,
            position: "absolute",
            top: 10 + 11 * Math.cos((Math.PI / 4) * idx - 0.1),
            left: 10 + 11 * Math.sin((Math.PI / 4) * idx - 0.1),
          }}
        />
      ))}
    </PlayerColorBox>
  );
}
