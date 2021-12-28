import React, { useState } from "react";
import { DEFAULT_MAP_SETTINGS, Game, Player } from "data/Game";
import { Flex } from "atoms/Flex";
import { TextButton } from "atoms/TextButton";
import { TextInput } from "atoms/TextInput";
import { doc, serverTimestamp } from "firebase/firestore";
import { docRef, collectionRef } from "init/firebase";
import { generateMap } from "util/mapgen";
import { City } from "../City";
import { runPlayerAction } from "util/run-game-action";
import { isCurrentPlayer } from "util/is-current-player";
import styled from "@emotion/styled";
import { TrainLine } from "../TrainLine";
import { LineSelection } from "../LineSelection";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Breakpoint, BREAKPOINT_MOBILE } from "atoms/Breakpoint";
import { updateRouteStates } from "../../../util/update-route-states";

interface Props {
  game: Game;
  me?: Player;
  highlightedNodes: string[];
  players: Player[];
  selectedLine?: LineSelection;

  setSelectedLine(selection?: LineSelection): void;
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
  setSelectedLine,
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
  const initialScale = Math.min(viewerScale.x, viewerScale.y);
  return (
    <TransformWrapper
      initialPositionX={
        Math.abs(viewerSize.x - game.map.size.width * initialScale) / 2
      }
      initialPositionY={
        Math.abs(viewerSize.y - game.map.size.height * initialScale) / 2
      }
      initialScale={initialScale}
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
              line.color.map((color, colorIdx) => {
                const destNos = [line.start, line.end].map((name) =>
                  game.map.destinations.findIndex((d) => d.name === name)
                );
                return (
                  <TrainLine
                    game={game}
                    me={me}
                    players={players}
                    line={line}
                    lineNo={lineNo}
                    color={color}
                    colorIdx={colorIdx}
                    usedByStation={
                      !!(
                        me &&
                        destNos
                          .filter(
                            (destNo) =>
                              game.boardState.stations.owners[destNo] ===
                              me.order
                          )
                          .find((destNo) =>
                            destNos.includes(
                              game.boardState.stations.lines[destNo][me.order]
                            )
                          )
                      )
                    }
                    key={lineNo * 2 + colorIdx}
                    onLineSelected={() => {
                      setSelectedLine({
                        line,
                        colorNo: colorIdx,
                        lineNo,
                        selection: [],
                        type: "line",
                      });
                    }}
                  />
                );
              })
            )}
            {map?.destinations.map((destination, idx) =>
              (() => {
                const isAdjacent = !!(
                  ((selectedLine?.type === "city" &&
                    selectedLine?.destination === undefined) ||
                    selectedLine?.type === "station") &&
                  selectedLine.city !== idx &&
                  map.lines
                    .filter((line) =>
                      [line.start, line.end].includes(destination.name)
                    )
                    .find((line) =>
                      [line.start, line.end].includes(
                        map.destinations[selectedLine.city].name
                      )
                    )
                );
                const isSelected =
                  (selectedLine?.type === "line" &&
                    (destination.name === selectedLine?.line.start ||
                      destination.name === selectedLine?.line.end)) ||
                  (selectedLine?.type === "city" && selectedLine.city === idx);
                return (
                  <City
                    game={game}
                    me={me}
                    destination={destination}
                    stationOwner={
                      game.boardState.stations.owners[idx] !== undefined
                        ? players[game.boardState.stations.owners[idx]]
                        : undefined
                    }
                    stationActive={
                      !!(
                        me &&
                        (game.boardState.stations.owners[idx] !== me?.order ||
                          Object.keys(game.boardState.lines)
                            .map((lineNo) => game.map.lines[Number(lineNo)])
                            .find(
                              (line) =>
                                [line.start, line.end].includes(
                                  destination.name
                                ) &&
                                [line.start, line.end].includes(
                                  game.map.destinations[
                                    game.boardState.stations.lines[idx][
                                      me.order
                                    ]
                                  ].name
                                )
                            ))
                      )
                    }
                    isHighlighted={highlightedNodes.includes(destination.name)}
                    isAdjacent={isAdjacent}
                    isSelected={isSelected}
                    onLineSelected={() => {
                      if (!me) {
                        return;
                      }
                      if (isAdjacent) {
                        if (selectedLine.type === "station") {
                          runPlayerAction(
                            game,
                            me,
                            async ({ game, me, transaction }) => {
                              game.boardState.stations.lines[
                                selectedLine.city
                              ] = {
                                ...(game.boardState.stations.lines[
                                  selectedLine.city
                                ] || {}),

                                [me.order]: idx,
                              };
                              transaction.update(docRef("games", game.id), {
                                [`boardState.stations.lines.${selectedLine.city}.${me.order}`]:
                                  idx,
                              });

                              transaction.update(
                                docRef("games", game.id, "players", me.name),
                                {
                                  routes: updateRouteStates(game, me).routes,
                                }
                              );
                            }
                          ).then(() => {
                            setSelectedLine();
                          });
                        } else {
                          setSelectedLine({
                            ...selectedLine,
                            destination: idx,
                          });
                        }
                      } else if (
                        game.boardState.stations.owners[idx] === me?.order
                      ) {
                        setSelectedLine({
                          type: "station",
                          city: idx,
                          selection: [],
                        });
                      } else {
                        setSelectedLine({
                          type: "city",
                          city: idx,
                          selection: [],
                        });
                      }
                    }}
                    key={destination.name}
                  />
                );
              })()
            )}
          </BoardBackground>
        </TransformComponent>
      </BoardBackdrop>
    </TransformWrapper>
  );
}
