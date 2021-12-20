import React, { useState } from "react";
import { DEFAULT_MAP_SETTINGS, Game, Line, Player } from "data/Game";
import { Flex } from "atoms/Flex";
import { TextButton } from "atoms/TextButton";
import { TextInput } from "atoms/TextInput";
import { doc, serverTimestamp } from "firebase/firestore";
import { docRef, collectionRef } from "init/firebase";
import { generateMap } from "util/mapgen";
import { City } from "./City";
import { runPlayerAction } from "util/run-game-action";
import { isCurrentPlayer } from "util/is-current-player";
import styled from "@emotion/styled";
import { TrainLine } from "./TrainLine";
import { LineSelection } from "./LineSelection";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Breakpoint, BREAKPOINT_MOBILE } from "atoms/Breakpoint";

interface Props {
  game: Game;
  me?: Player;
  highlightedNodes: string[];
  players: Player[];
  selectedLine?: LineSelection;

  onLineSelected(line: Line, lineNo: number, colorIdx: number): void;
}

const BoardBackdrop = styled.div<{ game: Game; me?: Player }>(
  {
    backgroundSize: "cover",
    position: "relative",
    width: "min(85vw, calc(100vw - 150px))",
    border: "5px solid black",
    maxHeight: "100%",
    overflow: "hidden",
    margin: 16,
    [Breakpoint.MOBILE]: {
      width: "100%",
      margin: "8px 0px",
    },
  },
  ({ game, me }) => ({
    background: me && isCurrentPlayer(game, me) ? "black" : "#333",
  })
);

const BoardBackground = styled.div<{ game: Game; me?: Player }>(
  {
    position: "relative",
  },
  ({ game, me }) => ({
    width: game.map.size.width,
    height: game.map.size.height,
  })
);

export function GameBoard({
  game,
  me,
  highlightedNodes,
  players,
  selectedLine,
  onLineSelected,
}: Props) {
  const MAP_DEFAULTS: { [key: string]: string } = {
    Cities: DEFAULT_MAP_SETTINGS.cities.toString(),
    Connectivity: DEFAULT_MAP_SETTINGS.connectivity.toString(),
    Routes: DEFAULT_MAP_SETTINGS.routes.toString(),
    Width: DEFAULT_MAP_SETTINGS.size.width.toString(),
    Height: DEFAULT_MAP_SETTINGS.size.height.toString(),
    //'Min Players': DEFAULT_MAP_SETTINGS.players.min.toString(),
    "Max Players": DEFAULT_MAP_SETTINGS.players.max.toString(),
  };
  const [mapSettings, setMapSettings] = useState(MAP_DEFAULTS);

  if (!game.map) return null;

  const map = game.map;
  const viewerSize = {
    x:
      window.innerWidth > BREAKPOINT_MOBILE
        ? Math.min(0.85 * window.innerWidth, window.innerWidth - 150)
        : window.innerWidth,
    y: window.innerHeight - 180,
  };
  const viewerScale = {
    x: viewerSize.x / game.map.size.width,
    y: viewerSize.y / game.map.size.height,
  };
  return (
    <TransformWrapper
      initialPositionX={
        viewerScale.x > viewerScale.y
          ? (game.map.size.width - viewerSize.x) / 2
          : 0
      }
      initialPositionY={
        viewerScale.y > viewerScale.x
          ? (game.map.size.height - viewerSize.y) / 2
          : 0
      }
      initialScale={Math.min(viewerScale.x, viewerScale.y)}
      limitToBounds={false}
      minScale={0.1}
      wheel={{
        step: 0.075,
      }}
    >
      <BoardBackdrop game={game} me={me}>
        <Flex>
          <span
            css={{
              color: "white",
              fontWeight: "bold",
              fontSize: 24,
              marginRight: "auto",
              [Breakpoint.MOBILE]: {
                fontSize: 16,
              },
            }}
          >
            {map?.name}
          </span>
          {!game.isStarted ? (
            <Flex>
              {Object.entries(MAP_DEFAULTS).map(([label, def]) => (
                <TextInput
                  key={label}
                  placeholder={`${label} (${def})`}
                  value={mapSettings[label]}
                  onChange={(e) => {
                    setMapSettings({
                      ...mapSettings,
                      [label]: e.currentTarget.value,
                    });
                  }}
                  css={{ width: 80 }}
                />
              ))}
              <TextButton
                onClick={() => {
                  if (!me) {
                    return;
                  }
                  runPlayerAction(
                    game,
                    me,
                    async ({ game, me, transaction }) => {
                      const newSettings = {
                        cities: Number(mapSettings.Cities),
                        connectivity: Number(mapSettings.Connectivity),
                        routes: Number(mapSettings.Routes),
                        size: {
                          width: Number(mapSettings.Width),
                          height: Number(mapSettings.Height),
                        },
                        players: {
                          min: DEFAULT_MAP_SETTINGS.players.min, // Number(mapSettings.min),
                          max: Number(mapSettings["Max Players"]),
                        },
                      };
                      transaction.update(docRef("games", game.id), {
                        map: generateMap({
                          ...DEFAULT_MAP_SETTINGS,
                          ...newSettings,
                        }),
                      });
                      await transaction.set(
                        doc(collectionRef("games", game.id, "events")),
                        {
                          author: me.name,
                          timestamp: serverTimestamp(),
                          message: `${me.name} updated the map`,
                        }
                      );
                    }
                  );
                }}
              >
                Randomize Map
              </TextButton>
            </Flex>
          ) : null}
        </Flex>
        <TransformComponent>
          <BoardBackground game={game} me={me}>
            {map?.lines.map((line, lineNo) =>
              line.color.map((color, colorIdx) => (
                <TrainLine
                  game={game}
                  me={me}
                  players={players}
                  line={line}
                  lineNo={lineNo}
                  color={color}
                  colorIdx={colorIdx}
                  key={lineNo * 2 + colorIdx}
                  onLineSelected={onLineSelected}
                />
              ))
            )}
            {map?.destinations.map((destination) => (
              <City
                destination={destination}
                isHighlighted={highlightedNodes.includes(destination.name)}
                isSelected={
                  destination.name === selectedLine?.line.start ||
                  destination.name === selectedLine?.line.end
                }
                key={destination.name}
              />
            ))}
          </BoardBackground>
        </TransformComponent>
      </BoardBackdrop>
    </TransformWrapper>
  );
}
