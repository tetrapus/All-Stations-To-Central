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
import { indexBy } from "../../util/index-by";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Breakpoint } from "atoms/Breakpoint";

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
  const [mapSettings, setMapSettings] = useState({
    cities: DEFAULT_MAP_SETTINGS.cities.toString(),
    connectivity: DEFAULT_MAP_SETTINGS.connectivity.toString(),
    routes: DEFAULT_MAP_SETTINGS.routes.toString(),
    size: {
      width: DEFAULT_MAP_SETTINGS.size.width.toString(),
      height: DEFAULT_MAP_SETTINGS.size.height.toString(),
    },
  });

  if (!game.map) return null;

  const playerdex = indexBy(players, "name");

  const map = game.map;

  return (
    <TransformWrapper
      initialPositionX={0}
      initialPositionY={0}
      initialScale={1}
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
            }}
          >
            {map?.name}
          </span>
          {!game.isStarted ? (
            <Flex>
              <TextInput
                placeholder="Cities"
                value={mapSettings.cities}
                onChange={(e) => {
                  setMapSettings({
                    ...mapSettings,
                    cities: e.currentTarget.value,
                  });
                }}
                css={{ width: 80 }}
              />
              <TextInput
                placeholder="Connectivity"
                value={mapSettings.connectivity}
                onChange={(e) => {
                  setMapSettings({
                    ...mapSettings,
                    connectivity: e.currentTarget.value,
                  });
                }}
                css={{ width: 80 }}
              />
              <TextInput
                placeholder="Routes (46)"
                css={{ width: 80 }}
                value={mapSettings.routes}
                onChange={(e) => {
                  setMapSettings({
                    ...mapSettings,
                    routes: e.currentTarget.value,
                  });
                }}
              />
              <TextInput
                placeholder="Width (1200)"
                css={{ width: 80 }}
                value={mapSettings.size.width}
                onChange={(e) => {
                  setMapSettings({
                    ...mapSettings,
                    size: {
                      width: e.currentTarget.value,
                      height: mapSettings.size.height,
                    },
                  });
                }}
              />
              <TextInput
                placeholder="Height (1200)"
                css={{ width: 80 }}
                value={mapSettings.size.height}
                onChange={(e) => {
                  setMapSettings({
                    ...mapSettings,
                    size: {
                      height: e.currentTarget.value,
                      width: mapSettings.size.width,
                    },
                  });
                }}
              />
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
                        cities: Number(mapSettings.cities),
                        connectivity: Number(mapSettings.connectivity),
                        routes: Number(mapSettings.routes),
                        size: {
                          width: Number(mapSettings.size.width),
                          height: Number(mapSettings.size.height),
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
                  players={playerdex}
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
