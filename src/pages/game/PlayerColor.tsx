import styled from "@emotion/styled";
import { Player } from "data/Game";
import React from "react";
import { PLAYER_ICONS } from "data/PlayerIcons";
import { nOf } from "util/n-of";
import { Flex } from "atoms/Flex";
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

const StationIndicator = styled.div<Props>(
  {
    width: 5,
    height: 5,
    border: "1px solid white",
    borderRadius: 3,
  },
  ({ player }) => ({
    background: player.color,
  })
);

export function PlayerColor({ player }: Props) {
  return (
    <PlayerColorBox player={player}>
      <PlayerSymbol player={player} />
      <Flex css={{ margin: "auto", justifyContent: "center", padding: 1 }}>
        {nOf(player.stationCount, (idx) => (
          <StationIndicator player={player} key={idx} />
        ))}
      </Flex>
    </PlayerColorBox>
  );
}
