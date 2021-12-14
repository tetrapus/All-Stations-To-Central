import { Link } from "react-router-dom";
import {
  useCollectionData,
  useDocumentData,
} from "react-firebase-hooks/firestore";
import dijkstra from "graphology-shortest-path/dijkstra";

import { collectionRef } from "init/firebase";
import { GameConverter, PlayerConverter } from "data/Game";
import { deleteField, orderBy, query } from "@firebase/firestore";
import useLocalStorage from "@rehooks/local-storage";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import { TextButton } from "atoms/TextButton";
import { deleteDoc, runTransaction, setDoc } from "@firebase/firestore";
import { Map, Player, TrainColor, trainColors } from "data/Game";
import { db, docRef } from "init/firebase";
import { distance, generateMap } from "../../util/mapgen";
import { Flex } from "atoms/Flex";
import { fillRepeats } from "util/citygen";
import arrayShuffle from "array-shuffle";
import { sortBy } from "util/sort-by";
import { Stack } from "atoms/Stack";
import { Route } from "../../data/Game";
import { generateColor } from "../../util/colorgen";
import { UndirectedGraph } from "graphology";

export function GameInterface() {
  const { id } = useParams<{ id: string }>();

  const [game, gameLoading] = useDocumentData(
    docRef("games", id).withConverter(GameConverter)
  ); // todo: error

  const [players, playersLoading] = useCollectionData(
    query(
      collectionRef("games", id, "players").withConverter(PlayerConverter),
      orderBy("order")
    )
  ); // todo: loading

  const [username] = useLocalStorage<string>("username");

  const [map, setMap] = useState<Map>();
  useEffect(() => {
    if (!game) return;
    if (game.map) {
      setMap(game.map);
    } else {
      setMap(
        generateMap({
          cities: 40,
          connectivity: 3,
          routes: 46,
          ferries: 0,
          tunnels: 0,
          players: { min: 2, max: 6 },
          canMonopolizeLineMin: 2,
          scoringTable: {
            1: 1,
            2: 2,
            3: 4,
            4: 7,
            5: 10,
            6: 15,
          },
        })
      );
    }
  }, [game]);

  if (!username || !players || !map) {
    return null;
  }

  const ratio = [16, 9];
  const width = 90;
  const height = (width * ratio[1]) / ratio[0];

  const Card = ({
    color,
    count,
    clickable,
    onClick,
  }: {
    color?: TrainColor;
    count?: number;
    clickable?: boolean;
    onClick?: () => void;
  }) => (
    <div
      css={{
        height: 64,
        width: 48,
        margin: 4,
        display: "flex",
        borderRadius: 3,
        border: "1px solid #999",
        background: color ? trainColors[color] : "white",
        cursor: clickable ? "pointer" : undefined,
      }}
      onClick={onClick}
    >
      <div css={{ fontSize: 24, fontWeight: "bold", margin: "auto" }}>
        {count}
      </div>
    </div>
  );

  if (playersLoading || gameLoading) {
    return null;
  }

  if (!game || !players) {
    return (
      <>
        Invalid game code!{" "}
        <Link to="/">
          <TextButton>Go Home</TextButton>
        </Link>
      </>
    );
  }

  const me = players.find((player) => player.name === username);
  const currentPlayer = players[game.turn % players.length];

  // Hand component
  const cardCounts: [TrainColor, number][] = me
    ? sortBy(
        Object.keys(trainColors)
          ?.map((color): [string, number] => [
            color,
            me.hand.filter((card) => card.color === color).length,
          ])
          .filter(([, count]) => count),
        (v) => v[1]
      )
    : [];

  const destinations = Object.fromEntries(
    map.destinations.map((city) => [city.name, city])
  );

  const RouteCard = ({
    count,
    route,
    clickable,
    onClick,
  }: {
    count?: number;
    route?: Route;
    clickable?: boolean;
    onClick?: () => void;
  }) => (
    <Stack
      css={{
        alignItems: "center",
        fontSize: 13,
        margin: 4,
        cursor: clickable ? "pointer" : undefined,
      }}
      onClick={onClick}
    >
      <Flex>{route ? route.start : null}</Flex>
      <Flex
        css={{
          background: "#333",
          width: 64,
          height: 36,
          borderRadius: 2,
          color: "white",
          fontWeight: "bold",
          position: "relative",
        }}
      >
        {route ? (
          <>
            <div
              css={{
                background: "orange",
                width: 6,
                height: 6,
                borderRadius: 3,
                position: "absolute",
                left: `${(destinations[route.start].position.x / 16) * 80}%`,
                top: `${(destinations[route.start].position.y / 9) * 80}%`,
              }}
            ></div>
            <div
              css={{
                background: "orange",
                width: 6,
                height: 6,
                borderRadius: 3,
                position: "absolute",
                left: `${(destinations[route.end].position.x / 16) * 80}%`,
                top: `${(destinations[route.end].position.y / 9) * 80}%`,
              }}
            ></div>
            <div css={{ margin: "auto" }}>{count}</div>
          </>
        ) : null}
      </Flex>
      <Flex>{route ? route.end : "Routes"}</Flex>
    </Stack>
  );

  const RouteChoices = ({
    routes,
    maxDiscard,
  }: {
    routes: Route[];
    maxDiscard: number;
  }) => {
    const [chosen, setChosen] = useState<number[]>([]);
    return (
      <>
        {routes.map((route, idx) => (
          <div
            onClick={() => {
              if (chosen.includes(idx)) {
                setChosen(chosen.filter((x) => x !== idx));
              } else if (chosen.length < maxDiscard) {
                setChosen([...chosen, idx]);
              }
            }}
            css={
              chosen.includes(idx) ? { fontStyle: "italic", opacity: 0.5 } : {}
            }
          >
            <RouteCard route={route} count={route.points} key={idx} />
          </div>
        ))}
        <TextButton
          css={{ fontSize: 14 }}
          onClick={() => {
            runTransaction(db, async (transaction) => {
              if (!me) {
                return;
              }
              await transaction.update(
                docRef("games", id, "players", me.name),
                {
                  routeChoices: deleteField(),
                  routes: [
                    ...routes.filter((route, idx) => !chosen.includes(idx)),
                    ...me.routes,
                  ],
                  isReady: true,
                }
              );
              await transaction.update(docRef("games", id), {
                "boardState.routes.discard": [
                  ...game.boardState.routes.discard,
                  ...routes.filter((route, idx) => chosen.includes(idx)),
                ],
                turnState:
                  game.turnState === "routes-taken" ? "choose" : game.turnState,
                turn:
                  game.turnState === "routes-taken" ? game.turn + 1 : game.turn,
                isReady:
                  game.isStarted &&
                  players.every(
                    (player) => player.name === me.name || player.isReady
                  ),
              });
            });
          }}
        >
          Discard {chosen.length}
        </TextButton>
      </>
    );
  };

  // TODO: Final turn logic
  return (
    <Stack>
      <Flex>
        <Flex css={{ marginRight: "auto" }}>
          {players?.map((player) => (
            <Flex
              css={{
                border: "4px solid",
                borderColor:
                  game.turn % players.length === player.order && game.isReady
                    ? "#111"
                    : "transparent",
                background:
                  game.turn % players.length === player.order && game.isReady
                    ? "white"
                    : "transparent",
                // TODO: final turn logic
              }}
              key={player.name}
            >
              <Flex
                css={{
                  margin: "12px 16px",
                  alignItems: "center",
                }}
              >
                <Flex
                  css={{
                    alignItems: "center",
                    fontWeight: player.name === username ? "bold" : "normal",
                    fontStyle: player.isReady ? "normal" : "italic",
                    marginRight: 8,
                  }}
                >
                  <div
                    css={{
                      background: player.color,
                      height: 16,
                      width: 16,
                      border: "1px solid black",
                      margin: "4px 8px",
                    }}
                  ></div>
                  {player.name}
                </Flex>
                <Flex css={{ alignItems: "center", fontSize: 13 }}>
                  <Flex
                    css={{
                      height: 28,
                      background: "white",
                      width: 20,
                      borderRadius: 2,
                      border: "1px solid black",
                    }}
                  >
                    <div css={{ margin: "auto" }}>{player.hand.length}</div>
                  </Flex>{" "}
                  <Stack>
                    <Flex
                      css={{
                        background: "#333",
                        width: 28,
                        height: 16,
                        borderRadius: 2,
                        color: "white",
                        marginLeft: 4,
                      }}
                    >
                      <Flex css={{ margin: "auto" }}>
                        {player.routes.length}
                      </Flex>
                    </Flex>
                    <Flex css={{ alignItems: "center" }}>
                      <div
                        css={{
                          height: 6,
                          background: player.color,
                          width: 16,
                          margin: 4,
                        }}
                      ></div>{" "}
                      {player.trainCount}
                    </Flex>
                  </Stack>
                </Flex>
              </Flex>
            </Flex>
          ))}
        </Flex>
        <span>
          {!game.isStarted ? (
            players.find((player) => player.name === username) ? (
              <TextButton
                onClick={async (event) => {
                  await deleteDoc(docRef("games", id, "players", username));
                }}
              >
                Leave Game
              </TextButton>
            ) : (
              <TextButton
                onClick={async (event) => {
                  const player: Player = {
                    name: username,
                    order: 1,
                    hand: [],
                    color: generateColor(), // todo
                    routes: [],
                    trainCount: 45,
                    stationCount: 0,
                    isReady: false,
                  };
                  await setDoc(
                    docRef("games", id, "players", username),
                    player
                  );
                }}
              >
                Join Game
              </TextButton>
            )
          ) : null}
          {game.isReady ? (
            <>
              {JSON.stringify(
                Object.fromEntries(
                  players.map((player) => [player.name, player.scores])
                )
              )}
              <TextButton
                onClick={() => {
                  runTransaction(db, async (transaction) => {
                    const graph = new UndirectedGraph();
                    map.destinations.forEach((destination) =>
                      graph.addNode(destination.name)
                    );

                    for (let i = 0; i < players.length; i++) {
                      const player = players[i];
                      const scores = {
                        routes: {} as { [key: number]: number },
                        lines: {} as { [key: number]: number },
                        bonuses: {},
                        stations: 0,
                        total: 0,
                      };
                      // Calculate lines score
                      const ownedLines = Object.entries(game.boardState.lines)
                        .map(([lineno, owners]) =>
                          Object.values(owners).includes(player.name)
                            ? [lineno]
                            : []
                        )
                        .flat(1)
                        .map((lineno) => map.lines[Number(lineno)]);
                      ownedLines.forEach((line) => {
                        if (scores.lines[line.length] === undefined) {
                          scores.lines[line.length] = 1;
                        } else {
                          scores.lines[line.length] += 1;
                        }
                        scores.total += map.scoringTable[line.length];
                      });
                      // Go through and score each route
                      graph.clearEdges();
                      ownedLines.forEach((line) =>
                        graph.addEdge(line.start, line.end)
                      );
                      scores.routes = Object.fromEntries(
                        player.routes.map((route, idx) => [
                          idx,
                          dijkstra.bidirectional(graph, route.start, route.end)
                            ? route.points
                            : -route.points,
                        ])
                      );
                      scores.total += Object.values(scores.routes).reduce(
                        (a, b) => a + b,
                        0
                      );
                      // TODO: Bonuses
                      // Save scores
                      transaction.update(
                        docRef("games", id, "players", player.name),
                        {
                          scores,
                        }
                      );
                    }
                  });
                }}
              >
                Debug: Score Game
              </TextButton>
            </>
          ) : null}
          {!game.isStarted && map ? (
            <TextButton
              onClick={async () => {
                await runTransaction(db, async (transaction) => {
                  const carriages = arrayShuffle(
                    fillRepeats(map.deck, (color) => ({ color }))
                  );
                  const faceUp = [
                    carriages.pop(),
                    carriages.pop(),
                    carriages.pop(),
                    carriages.pop(),
                    carriages.pop(),
                  ];
                  const routes = arrayShuffle([...map.routes]);
                  for (let i = 0; i < players.length; i++) {
                    await transaction.update(
                      docRef("games", id, "players", players[i].name),
                      {
                        hand: [
                          carriages.pop(),
                          carriages.pop(),
                          carriages.pop(),
                          carriages.pop(),
                        ],
                        "routeChoices.routes": [
                          routes.pop(),
                          routes.pop(),
                          routes.pop(),
                          routes.pop(),
                          routes.pop(),
                        ],
                        "routeChoices.keepMin": 2,
                      }
                    );
                  }
                  await transaction.update(docRef("games", id), {
                    "boardState.carriages.deck": carriages,
                    "boardState.carriages.faceUp": faceUp,
                    "boardState.routes.deck": routes,
                    isStarted: true,
                    map: map,
                    turnState: "choose",
                  });
                });
              }}
            >
              Start Game
            </TextButton>
          ) : null}
        </span>
      </Flex>
      <>
        <Flex>
          <Flex css={{ marginRight: "auto" }}>
            {cardCounts?.map(([card, count], idx) => (
              <Card key={idx} color={card} count={count}></Card>
            ))}
          </Flex>
          {game.boardState.carriages.faceUp?.map((card, idx) => (
            <Card
              key={idx}
              color={card.color}
              clickable={
                (game.turnState === "choose" || game.turnState === "drawn") &&
                game.isReady &&
                currentPlayer &&
                currentPlayer.name === username
              }
              onClick={() => {
                runTransaction(db, async (transaction) => {
                  if (
                    (game.turnState === "choose" ||
                      game.turnState === "drawn") &&
                    game.isReady &&
                    currentPlayer &&
                    currentPlayer.name === username
                  ) {
                    const newCard = game.boardState.carriages.deck.pop();
                    if (!newCard) {
                      throw new Error("Game state broken");
                    }
                    game.boardState.carriages.faceUp.splice(idx, 1, newCard);
                    // TODO: Rainbow Refresh rule
                    // TODO: Cannot draw rainbow on 'drawn' phase rule
                    const newTurn =
                      game.turnState === "drawn" || card.color === "rainbow";
                    transaction.update(docRef("games", id), {
                      "boardState.carriages.deck":
                        game.boardState.carriages.deck,
                      "boardState.carriages.faceUp":
                        game.boardState.carriages.faceUp,
                      turn: newTurn ? game.turn + 1 : game.turn,
                      turnState: newTurn ? "choose" : "drawn",
                    });
                    transaction.update(
                      docRef("games", id, "players", currentPlayer.name),
                      {
                        hand: [...currentPlayer.hand, card],
                      }
                    );
                  }
                });
              }}
            ></Card>
          ))}
          <Card
            count={game.boardState.carriages.deck.length}
            clickable={
              (game.turnState === "choose" || game.turnState === "drawn") &&
              game.isReady &&
              currentPlayer &&
              currentPlayer.name === username
            }
            onClick={() => {
              runTransaction(db, async (transaction) => {
                if (
                  (game.turnState === "choose" || game.turnState === "drawn") &&
                  game.isReady &&
                  currentPlayer &&
                  currentPlayer.name === username
                ) {
                  const newCard = game.boardState.carriages.deck.pop();
                  if (!newCard) {
                    throw new Error("Game state broken");
                  }
                  const newTurn = game.turnState === "drawn";
                  transaction.update(docRef("games", id), {
                    "boardState.carriages.deck": game.boardState.carriages.deck,
                    turn: newTurn ? game.turn + 1 : game.turn,
                    turnState: newTurn ? "choose" : "drawn",
                  });
                  transaction.update(
                    docRef("games", id, "players", currentPlayer.name),
                    {
                      hand: [...currentPlayer.hand, newCard],
                    }
                  );
                }
              });
            }}
          ></Card>
          <RouteCard
            count={game.boardState.routes.deck.length}
            clickable={
              currentPlayer &&
              currentPlayer.name === username &&
              game.isReady &&
              game.turnState === "choose"
            }
            onClick={() => {
              if (
                !currentPlayer ||
                currentPlayer.name !== username ||
                !game.isReady ||
                game.turnState !== "choose"
              ) {
                return;
              }
              runTransaction(db, async (transaction) => {
                await transaction.update(
                  docRef("games", id, "players", currentPlayer.name),
                  {
                    "routeChoices.routes": [
                      game.boardState.routes.deck.pop(),
                      game.boardState.routes.deck.pop(),
                      game.boardState.routes.deck.pop(),
                    ],
                    "routeChoices.keepMin": 1,
                  }
                );
                await transaction.update(docRef("games", id), {
                  "boardState.routes.deck": game.boardState.routes.deck,
                  turnState: "routes-taken",
                });
              });
            }}
          ></RouteCard>
        </Flex>
        <Flex>
          <div
            css={{
              width: `${width}vw`,
              height: `${height}vw`,
              background:
                "linear-gradient(rgba(0,0,0,0.5), rgba(255,255,255,0.7)), url(https://sitesmedia.s3.amazonaws.com/creekconnections/files/2014/09/topomap.jpg)",
              backgroundSize: "cover",
              border: "5px solid black",
              margin: 16,
              position: "relative",
            }}
          >
            <span css={{ color: "white", fontWeight: "bold", fontSize: 24 }}>
              {map?.name}
            </span>
            {map?.lines.map((line, lineNo) => {
              const start = map.destinations.find(
                (destination) => line.start === destination.name
              );
              const end = map.destinations.find(
                (destination) => line.end === destination.name
              );
              if (!start || !end) return null;
              const counts = Object.fromEntries(cardCounts);
              const color = line.color[0];
              const owner = game.boardState.lines[lineNo]?.[0];
              const playable =
                game.turnState === "choose" &&
                game.isReady &&
                game.isStarted &&
                currentPlayer &&
                currentPlayer.name === username &&
                !owner &&
                line.length <= currentPlayer.trainCount &&
                counts[color] >= line.length;
              return (
                <Flex
                  css={{
                    left: `${(start.position.x * width) / ratio[0]}vw`,
                    position: "absolute",
                    top: `${(start.position.y * height) / ratio[1]}vw`,
                    transform: `rotate(${
                      Math.atan2(
                        end.position.y - start.position.y,
                        end.position.x - start.position.x
                      ) *
                      (180 / Math.PI)
                    }deg) translateY(-50%)`,
                    transformOrigin: "top left",
                    height: 6,
                    width: `${distance(start, end) * 5.6}vw`,
                    "--hovercolor": "rgba(0,0,0,0.2)",
                    ":hover": {
                      "--hovercolor": playable
                        ? currentPlayer.color
                        : undefined,
                      cursor: playable ? "pointer" : undefined,
                    },
                    background: owner
                      ? players.find((p) => p.name === owner)?.color
                      : undefined,
                  }}
                  onClick={() => {
                    if (playable && game.isReady) {
                      // TODO: use rainbow, feedback if cannot take
                      runTransaction(db, async (transaction) => {
                        const discard = fillRepeats(
                          { [color]: line.length },
                          (color) => ({ color })
                        );
                        await transaction.update(docRef("games", id), {
                          [`boardState.lines.${lineNo}.${0}`]:
                            currentPlayer.name,
                          "boardState.carriages.discard": [
                            ...game.boardState.carriages.discard,
                            ...discard,
                          ],
                          turn: game.turn + 1,
                          turnState: "choose",
                        });
                        if (currentPlayer.trainCount - line.length) {
                          // Final turn triggered!!!
                          await transaction.update(docRef("games", id), {
                            finalTurn: game.turn + players.length - 1,
                          });
                        }
                        await transaction.update(
                          docRef("games", id, "players", currentPlayer.name),
                          {
                            trainCount: currentPlayer.trainCount - line.length,
                            hand: fillRepeats(
                              {
                                ...counts,
                                [color]: counts[color] - line.length,
                              },
                              (color) => ({ color })
                            ),
                          }
                        );
                      });
                    }
                  }}
                >
                  <Flex
                    css={{ width: "100%", paddingLeft: 12, paddingRight: 12 }}
                  >
                    {new Array(line.length).fill(0).map((_, idx) => (
                      <Flex
                        key={idx}
                        css={{
                          borderColor: trainColors[line.color[0]],
                          borderWidth: 2,
                          borderStyle: "solid",
                          margin: "0px 8px 0px 8px",
                          flexGrow: 1,
                          height: 10,
                          position: "relative",
                          top: -4,
                          background: game.boardState.lines[lineNo]?.[0]
                            ? players.find(
                                (p) =>
                                  p.name === game.boardState.lines[lineNo]?.[0]
                              )?.color
                            : "var(--hovercolor)",
                          transform: `translateY(${
                            (16 * line.length) / 2 -
                            Math.abs(
                              (idx + 0.5 - Math.ceil(line.length / 2)) /
                                line.length
                            ) *
                              (16 * line.length)
                          }px) rotate(${
                            -((idx + 0.5 - line.length / 2) / line.length) * 40
                          }deg)`,
                        }}
                      ></Flex>
                    ))}
                  </Flex>
                </Flex>
              );
            })}
            {map?.destinations.map((destination) => (
              <Flex
                css={{
                  left: `${(destination.position.x * width) / ratio[0]}vw`,
                  position: "absolute",
                  top: `${(destination.position.y * height) / ratio[1]}vw`,
                  color: "white",
                  transform: "translateY(-50%)",
                }}
              >
                <div
                  css={{
                    borderRadius: 12,
                    width: 22,
                    height: 22,
                    background:
                      "radial-gradient(circle, rgba(255,233,0,1) 0%, rgba(255,79,0,1) 100%)",
                    border: "1px solid #FFD700",
                    transform: "translateX(-50%)",
                  }}
                ></div>
                <div
                  css={{
                    background: "rgba(0, 0, 0, 0.5)",
                    fontSize: 12,
                    padding: "2px 4px",
                    transform: "translateX(-8px)",
                    margin: "auto",
                  }}
                >
                  {destination.name}
                </div>
              </Flex>
            ))}
          </div>
          <Stack css={{ marginLeft: "auto", marginTop: 16 }}>
            {me?.routeChoices ? (
              <Stack css={{ background: "pink" }}>
                <div css={{ fontSize: 13, fontWeight: "bold", padding: 4 }}>
                  Discard up to{" "}
                  {me.routeChoices.routes.length - me.routeChoices.keepMin}
                </div>
                <RouteChoices
                  routes={me.routeChoices.routes}
                  maxDiscard={
                    me.routeChoices.routes.length - me.routeChoices.keepMin
                  }
                />
              </Stack>
            ) : null}
            {me?.routes.map((route, idx) => (
              <RouteCard route={route} count={route.points} key={idx} />
            ))}
          </Stack>
        </Flex>
      </>
    </Stack>
  );
}
