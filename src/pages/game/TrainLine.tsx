import styled from "@emotion/styled";
import { Flex } from "atoms/Flex";
import { CELL_SIZE } from "data/Board";
import {
  Line,
  Destination,
  Game,
  Player,
  trainColors,
  tunnelColors,
  ferryInsignia,
  trainPatterns,
} from "data/Game";
import React from "react";
import { getCardCounts } from "util/get-card-counts";
import { indexBy } from "util/index-by";
import { distance } from "util/mapgen";
import { PlayerSymbol } from "./PlayerColor";

const Locomotive = styled(Flex)<{
  color: string;
  line: Line;
  idx: number;
}>(
  {
    borderWidth: 2,
    margin: "0px 4px 0px 4px",
    flexGrow: 1,
    height: 10,
    position: "relative",
    top: -4,
  },
  ({ color, line, idx }) => ({
    borderColor: color,
    borderImage: color,
    borderImageSlice: 1,
    borderStyle: line.isTunnel
      ? "dashed"
      : line.ferries > idx
      ? "double"
      : "solid",
    borderRadius: line.isTunnel || line.ferries ? 4 : 0,
    borderWidth: line.ferries > idx ? 3 : 2,
    transform: `translateY(${
      (10 * line.length) / 2 -
      Math.abs((idx + 0.5 - Math.ceil(line.length / 2)) / line.length) *
        (10 * line.length)
    }px) rotate(${-((idx + 0.5 - line.length / 2) / line.length) * 40}deg)`,
  })
);

const LocomotiveInner = styled(Flex)<{
  ownerColor?: string;
  line: Line;
  idx: number;
}>(
  {
    width: "100%",
    margin: 1,
  },
  ({ ownerColor, line, idx }) => ({
    background: ownerColor || "var(--hovercolor)",
    backgroundImage:
      !ownerColor && line.ferries > idx ? "var(--ferryImg)" : undefined,
    backgroundRepeat: "no-repeat",
    backgroundSize: "contain",
    backgroundPosition: "center",
  })
);

const TrainLineContainer = styled(Flex)<{
  line: Line;
  colorIdx: number;
  playable: boolean;
  hintColor?: string;
  destinations: Destination[];
}>(
  {
    position: "absolute",
    transformOrigin: "top left",
    height: 4,
    "--ferryImg": ferryInsignia,
  },
  ({ line, destinations, colorIdx, playable, hintColor }) => {
    const citydex = indexBy(destinations, "name");
    const start = citydex[line.start];
    const end = citydex[line.end];
    return {
      left: CELL_SIZE * start.position.x,
      top: CELL_SIZE * start.position.y,
      transform: `rotate(${
        Math.atan2(
          end.position.y - start.position.y,
          end.position.x - start.position.x
        ) *
        (180 / Math.PI)
      }deg) translateY(-50%) translateY(${
        line.color.length > 1 ? (colorIdx - 0.5) * 16 : 0
      }px)`,
      width: distance(start, end) * CELL_SIZE,
      ":hover": {
        "--hovercolor": playable ? hintColor : undefined,
        "--ferryImg": playable ? "var(--hovercolor)" : undefined,
        cursor: playable ? "pointer" : undefined,
      },
    };
  }
);

interface Props {
  game: Game;
  me?: Player;
  players: { [name: string]: Player };
  line: Line;
  lineNo: number;
  color: string;
  colorIdx: number;

  onLineSelected(line: Line, lineNo: number, colorIdx: number): void;
}

export function TrainLine({
  game,
  line,
  lineNo,
  color,
  colorIdx,
  me,
  players,
  onLineSelected,
}: Props) {
  const map = game.map;
  const start = map.destinations.find(
    (destination) => line.start === destination.name
  );
  const end = map.destinations.find(
    (destination) => line.end === destination.name
  );
  if (!start || !end) return null;
  const owner = game.boardState.lines[lineNo]?.[0];
  const playable = (game: Game, me: Player) => {
    const counts = Object.fromEntries(getCardCounts(me));
    return (
      // game.turnState === "choose" &&
      // isCurrentPlayer(game, me) &&
      !owner &&
      line.length <= me.trainCount &&
      (color === "rainbow"
        ? Math.max(...Object.values({ ...counts, rainbow: 0 }))
        : counts[color] || 0) +
        (counts["rainbow"] || 0) >=
        line.length
    );
  };
  return (
    <TrainLineContainer
      line={line}
      colorIdx={colorIdx}
      playable={!!(me && playable(game, me))}
      hintColor={me?.color}
      destinations={map.destinations}
      onClick={() => {
        if (!!(me && playable(game, me))) {
          onLineSelected(line, lineNo, colorIdx);
        }
      }}
    >
      <Flex
        css={{
          width: "100%",
          paddingLeft: 12,
          paddingRight: 12,
        }}
      >
        {new Array(line.length).fill(0).map((_, idx) => (
          <Locomotive
            key={idx}
            color={line.isTunnel ? tunnelColors[color] : trainColors[color]}
            line={line}
            idx={idx}
          >
            <Flex
              css={{
                width: "100%",
                background: trainPatterns(0.5)[color],
                backgroundSize: "contain",
              }}
            >
              <LocomotiveInner
                line={line}
                idx={idx}
                ownerColor={
                  players[game.boardState.lines[lineNo]?.[colorIdx]]?.color
                }
              >
                {game.boardState.lines[lineNo]?.[colorIdx] && (
                  <PlayerSymbol
                    player={players[game.boardState.lines[lineNo]?.[colorIdx]]}
                  ></PlayerSymbol>
                )}
              </LocomotiveInner>
            </Flex>
          </Locomotive>
        ))}
      </Flex>
    </TrainLineContainer>
  );
}
