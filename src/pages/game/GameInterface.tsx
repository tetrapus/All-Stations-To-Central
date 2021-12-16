import { Link } from "react-router-dom";
import {
  useCollectionData,
  useDocumentData,
} from "react-firebase-hooks/firestore";
import dijkstra from "graphology-shortest-path/dijkstra";

import { collectionRef } from "init/firebase";
import {
  DEFAULT_MAP_SETTINGS,
  GameConverter,
  PlayerConverter,
} from "data/Game";
import {
  deleteField,
  orderBy,
  query,
  serverTimestamp,
  Transaction,
} from "@firebase/firestore";
import useLocalStorage from "@rehooks/local-storage";
import React, { useState } from "react";
import { useParams } from "react-router";
import { TextButton } from "atoms/TextButton";
import { deleteDoc, runTransaction, setDoc } from "@firebase/firestore";
import { Player, TrainColor, trainColors } from "data/Game";
import { db, docRef } from "init/firebase";
import { distance } from "../../util/mapgen";
import { Flex } from "atoms/Flex";
import { fillRepeats } from "util/citygen";
import arrayShuffle from "array-shuffle";
import { sortBy } from "util/sort-by";
import { Stack } from "atoms/Stack";
import { Route } from "../../data/Game";
import { generateColor } from "../../util/colorgen";
import { UndirectedGraph } from "graphology";
import { Scoreboard } from "./Scoreboard";
import { PlayerColor } from "./PlayerColor";
import { ScoreCard } from "./ScoreCard";
import { RouteCard } from "./RouteCard";
import { generateMap } from "util/mapgen";
import { CELL_SIZE } from "data/Board";
import { TextInput } from "atoms/TextInput";
import { addDoc } from "firebase/firestore";

/**
 * TODO:
 *
 * Ferries
 * Tunnels
 * Event feed
 * Sounds
 * Map Presets
 * Special Rules
 * Rules Explainer
 * Rainbow Route Color Selection
 * Background Generation
 **/

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

  const [events] = useCollectionData(
    query(collectionRef("games", id, "events"), orderBy("timestamp", "desc"))
  ); // todo: loading

  const [username] = useLocalStorage<string>("username");

  const [mapSettings, setMapSettings] = useState(DEFAULT_MAP_SETTINGS);

  const map = game?.map;

  if (!username || !players || !map) {
    return null;
  }

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
  const currentPlayer =
    game.finalTurn && game.turn > game.finalTurn
      ? undefined
      : players[game.turn % players.length];

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

  const getMapGraph = () => {
    const graph = new UndirectedGraph();
    map.destinations.forEach((destination) => graph.addNode(destination.name));
    return graph;
  };

  const getOwnedLines = (player: Player) => {
    return Object.entries(game.boardState.lines)
      .map(([lineno, owners]) =>
        Object.values(owners).includes(player.name) ? [lineno] : []
      )
      .flat(1)
      .map((lineno) => map.lines[Number(lineno)]);
  };

  const nextTurn = (transaction: Transaction) => {
    if (game.finalTurn && game.turn >= game.finalTurn) {
      const graph = getMapGraph();

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
        const ownedLines = getOwnedLines(player);
        // Go through and score each route
        graph.clearEdges();
        ownedLines.forEach((line) => graph.addEdge(line.start, line.end));
        ownedLines.forEach((line) => {
          if (scores.lines[line.length] === undefined) {
            scores.lines[line.length] = 1;
          } else {
            scores.lines[line.length] += 1;
          }
          scores.total += map.scoringTable[line.length];
        });
        scores.routes = Object.fromEntries(
          player.routes.map((route, idx) => [
            idx,
            dijkstra.bidirectional(graph, route.start, route.end)
              ? route.points
              : -route.points,
          ])
        );
        scores.total += Object.values(scores.routes).reduce((a, b) => a + b, 0);
        // TODO: Bonuses
        // Save scores
        transaction.update(docRef("games", id, "players", player.name), {
          scores,
        });
      }
    }
    return game.turn + 1;
  };

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
            <RouteCard
              route={route}
              count={route.points}
              key={idx}
              destinations={destinations}
            />
          </div>
        ))}
        <TextButton
          css={{ fontSize: 14 }}
          onClick={() => {
            runTransaction(db, async (transaction) => {
              if (!me) {
                return;
              }
              const graph = getMapGraph();
              const ownedLines = getOwnedLines(me);

              ownedLines.forEach((line) => graph.addEdge(line.start, line.end));
              const newRoutes = routes.map((route) => ({
                ...route,
                won:
                  route.won ||
                  !!dijkstra.bidirectional(graph, route.start, route.end),
              }));

              await transaction.update(
                docRef("games", id, "players", me.name),
                {
                  routeChoices: deleteField(),
                  routes: [
                    ...newRoutes.filter((route, idx) => !chosen.includes(idx)),
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
                  game.turnState === "routes-taken"
                    ? nextTurn(transaction)
                    : game.turn,
                isReady:
                  game.isStarted &&
                  players.every(
                    (player) => player.name === me.name || player.isReady
                  ),
              });
              await addDoc(collectionRef("games", id, "events"), {
                author: username,
                timestamp: serverTimestamp(),
                message: `${username} chose their routes`,
              });
            });
          }}
        >
          Discard {chosen.length}
        </TextButton>
      </>
    );
  };

  return (
    <Stack>
      <Flex>
        <Flex css={{ marginRight: "auto" }}>
          {players?.map((player) => {
            return (
              <Flex
                css={{
                  border: "1px solid",
                  margin: 3,
                  borderColor:
                    game.turn % players.length === player.order && game.isReady
                      ? "#111"
                      : "transparent",
                  background:
                    game.turn % players.length === player.order && game.isReady
                      ? "white"
                      : "transparent",
                  opacity:
                    game.finalTurn &&
                    currentPlayer &&
                    (game.turn - currentPlayer.order + player.order <
                      game.turn ||
                      game.turn - currentPlayer.order + player.order >
                        game.finalTurn)
                      ? 0.3
                      : 1,
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
                    <PlayerColor player={player} />
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
            );
          })}
        </Flex>
        <span>
          {!game.isStarted ? (
            players.find((player) => player.name === username) ? (
              <TextButton
                onClick={async (event) => {
                  await deleteDoc(docRef("games", id, "players", username));
                  await addDoc(collectionRef("games", id, "events"), {
                    author: username,
                    timestamp: serverTimestamp(),
                    message: `${username} left the game`,
                  });
                }}
              >
                Leave Game
              </TextButton>
            ) : (
              <TextButton
                onClick={async (event) => {
                  const player: Player = {
                    name: username,
                    order: players.length,
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
                  await addDoc(collectionRef("games", id, "events"), {
                    author: username,
                    timestamp: serverTimestamp(),
                    message: `${username} joined the game`,
                  });
                }}
              >
                Join Game
              </TextButton>
            )
          ) : null}

          {game.isReady && game.finalTurn && game.turn <= game.finalTurn ? (
            <strong css={{ margin: 8 }}>
              {game.finalTurn === game.turn
                ? "Final Turn"
                : `${game.finalTurn - game.turn} turns left`}
            </strong>
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
                  await addDoc(collectionRef("games", id, "events"), {
                    author: username,
                    timestamp: serverTimestamp(),
                    message: `${username} began the game`,
                  });
                });
              }}
            >
              Start Game
            </TextButton>
          ) : null}
        </span>
        <ScoreCard map={map} />
      </Flex>
      {game.finalTurn && game.finalTurn < game.turn ? (
        <Scoreboard players={players} destinations={destinations}></Scoreboard>
      ) : null}
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
                    if (!game.boardState.carriages.deck.length) {
                      game.boardState.carriages.deck =
                        game.boardState.carriages.discard;
                      game.boardState.carriages.discard = [];
                    }
                    game.boardState.carriages.faceUp.splice(idx, 1, newCard);
                    // TODO: Rainbow Refresh rule
                    // TODO: Cannot draw rainbow on 'drawn' phase rule
                    const newTurn =
                      game.turnState === "drawn" || card.color === "rainbow";
                    transaction.update(docRef("games", id), {
                      "boardState.carriages.deck":
                        game.boardState.carriages.deck,
                      "boardState.carriages.discard":
                        game.boardState.carriages.discard,
                      "boardState.carriages.faceUp":
                        game.boardState.carriages.faceUp,
                      turn: newTurn ? nextTurn(transaction) : game.turn,
                      turnState: newTurn ? "choose" : "drawn",
                    });
                    transaction.update(
                      docRef("games", id, "players", currentPlayer.name),
                      {
                        hand: [...currentPlayer.hand, card],
                      }
                    );
                    await addDoc(collectionRef("games", id, "events"), {
                      author: username,
                      timestamp: serverTimestamp(),
                      message: `${username} drew a card`,
                    });
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
                  if (!game.boardState.carriages.deck.length) {
                    game.boardState.carriages.deck =
                      game.boardState.carriages.discard;
                    game.boardState.carriages.discard = [];
                  }
                  const newTurn = game.turnState === "drawn";
                  transaction.update(docRef("games", id), {
                    "boardState.carriages.deck": game.boardState.carriages.deck,
                    "boardState.carriages.discard":
                      game.boardState.carriages.discard,
                    turn: newTurn ? nextTurn(transaction) : game.turn,
                    turnState: newTurn ? "choose" : "drawn",
                  });
                  transaction.update(
                    docRef("games", id, "players", currentPlayer.name),
                    {
                      hand: [...currentPlayer.hand, newCard],
                    }
                  );
                  await addDoc(collectionRef("games", id, "events"), {
                    author: username,
                    timestamp: serverTimestamp(),
                    message: `${username} drew a card`,
                  });
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
            destinations={destinations}
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
                if (game.boardState.routes.deck.length <= 3) {
                  game.boardState.routes.deck = [
                    ...game.boardState.routes.deck,
                    ...arrayShuffle(game.boardState.routes.discard),
                  ];
                  game.boardState.routes.discard = [];
                }
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
                  "boardState.routes.discard": game.boardState.routes.discard,
                  turnState: "routes-taken",
                });
                await addDoc(collectionRef("games", id, "events"), {
                  author: username,
                  timestamp: serverTimestamp(),
                  message: `${username} took 3 routes`,
                });
              });
            }}
          ></RouteCard>
        </Flex>
        <Flex>
          <div
            css={{
              width: map.size.width,
              height: map.size.height,
              background: currentPlayer?.name === username ? "black" : "#333",
              backgroundSize: "cover",
              border: "5px solid black",
              margin: 16,
              position: "relative",
            }}
          >
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
                        cities: Number(e.currentTarget.value),
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
                        connectivity: Number(e.currentTarget.value),
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
                        routes: Number(e.currentTarget.value),
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
                          width: Number(e.currentTarget.value),
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
                          height: Number(e.currentTarget.value),
                          width: mapSettings.size.width,
                        },
                      });
                    }}
                  />
                  <TextButton
                    onClick={() => {
                      runTransaction(db, async (transaction) => {
                        transaction.update(docRef("games", id), {
                          map: generateMap({
                            ...DEFAULT_MAP_SETTINGS,
                            ...mapSettings,
                          }),
                        });
                        await addDoc(collectionRef("games", id, "events"), {
                          author: username,
                          timestamp: serverTimestamp(),
                          message: `${username} updated the map`,
                        });
                      });
                    }}
                  >
                    Randomize Map
                  </TextButton>
                </Flex>
              ) : null}
            </Flex>
            {map?.lines.map((line, lineNo) =>
              line.color.map((color, colorIdx) => {
                const start = map.destinations.find(
                  (destination) => line.start === destination.name
                );
                const end = map.destinations.find(
                  (destination) => line.end === destination.name
                );
                if (!start || !end) return null;
                const counts = Object.fromEntries(cardCounts);
                const owner = game.boardState.lines[lineNo]?.[0];
                const playable =
                  game.turnState === "choose" &&
                  game.isReady &&
                  game.isStarted &&
                  currentPlayer &&
                  currentPlayer.name === username &&
                  !owner &&
                  line.length <= currentPlayer.trainCount &&
                  (color === "rainbow"
                    ? Math.max(...Object.values({ ...counts, rainbow: 0 }))
                    : counts[color] || 0) +
                    (counts["rainbow"] || 0) >=
                    line.length;
                return (
                  <Flex
                    css={{
                      left: CELL_SIZE * start.position.x,
                      position: "absolute",
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
                      transformOrigin: "top left",
                      height: 4,
                      width: distance(start, end) * CELL_SIZE,
                      "--hovercolor": "rgba(0,0,0,0.2)",
                      ":hover": {
                        "--hovercolor": playable
                          ? currentPlayer.color
                          : undefined,
                        cursor: playable ? "pointer" : undefined,
                      },
                    }}
                    onClick={() => {
                      if (playable && game.isReady) {
                        runTransaction(db, async (transaction) => {
                          const useColor =
                            line.color[colorIdx] === "rainbow"
                              ? sortBy(
                                  Object.entries(counts),
                                  (e) => e[1]
                                )[0][0] || line.color[colorIdx]
                              : line.color[colorIdx];
                          console.log(line);
                          const coreUsed = Math.min(
                            line.length,
                            counts[useColor]
                          );
                          const rainbowsUsed = line.length - coreUsed;
                          const discard = [
                            ...Array(coreUsed).fill({ color: useColor }),
                            ...Array(coreUsed).fill({ color: useColor }),
                          ];

                          await transaction.update(docRef("games", id), {
                            [`boardState.lines.${lineNo}.${colorIdx}`]:
                              currentPlayer.name,
                            "boardState.carriages.discard": [
                              ...game.boardState.carriages.discard,
                              ...discard,
                            ],
                            turn: nextTurn(transaction),
                            turnState: "choose",
                          });
                          if (currentPlayer.trainCount - line.length <= 0) {
                            // Final turn triggered!!!
                            await transaction.update(docRef("games", id), {
                              finalTurn: game.turn + players.length - 1,
                            });
                          }
                          // Update any won routes
                          const graph = getMapGraph();
                          const ownedLines = getOwnedLines(currentPlayer);
                          graph.addEdge(line.start, line.end);

                          ownedLines.forEach((line) =>
                            graph.addEdge(line.start, line.end)
                          );
                          const routes = currentPlayer.routes.map((route) => ({
                            ...route,
                            won:
                              route.won ||
                              !!dijkstra.bidirectional(
                                graph,
                                route.start,
                                route.end
                              ),
                          }));
                          console.log({
                            ...counts,
                            [useColor]: (counts[useColor] || 0) - coreUsed,
                            rainbow: (counts["rainbow"] || 0) - rainbowsUsed,
                          });
                          await transaction.update(
                            docRef("games", id, "players", currentPlayer.name),
                            {
                              trainCount:
                                currentPlayer.trainCount - line.length,
                              hand: fillRepeats(
                                {
                                  ...counts,
                                  [useColor]: Math.max(
                                    (counts[useColor] || 0) - coreUsed,
                                    0
                                  ),
                                  rainbow:
                                    (counts["rainbow"] || 0) - rainbowsUsed,
                                },
                                (color) => ({ color })
                              ),
                              routes: routes,
                            }
                          );
                          await addDoc(collectionRef("games", id, "events"), {
                            author: username,
                            timestamp: serverTimestamp(),
                            message: `${username} claimed ${line.start} to ${line.end}`,
                          });
                        });
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
                        <Flex
                          key={idx}
                          css={{
                            borderColor: trainColors[color],
                            borderImage: trainColors[color],
                            borderImageSlice: 1,
                            borderWidth: 2,
                            borderStyle: "solid",
                            margin: "0px 4px 0px 4px",
                            flexGrow: 1,
                            height: 10,
                            position: "relative",
                            top: -4,
                            background: game.boardState.lines[lineNo]?.[
                              colorIdx
                            ]
                              ? players.find(
                                  (p) =>
                                    p.name ===
                                    game.boardState.lines[lineNo]?.[colorIdx]
                                )?.color
                              : "var(--hovercolor)",
                            transform: `translateY(${
                              (10 * line.length) / 2 -
                              Math.abs(
                                (idx + 0.5 - Math.ceil(line.length / 2)) /
                                  line.length
                              ) *
                                (10 * line.length)
                            }px) rotate(${
                              -((idx + 0.5 - line.length / 2) / line.length) *
                              40
                            }deg)`,
                          }}
                        ></Flex>
                      ))}
                    </Flex>
                  </Flex>
                );
              })
            )}
            {map?.destinations.map((destination) => (
              <Flex
                css={{
                  left: CELL_SIZE * destination.position.x,
                  position: "absolute",
                  top: CELL_SIZE * destination.position.y,
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
                    fontSize: 11,
                    padding: "2px",
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
                <div
                  css={{
                    fontSize: 13,
                    fontWeight: "bold",
                    padding: 4,
                    textAlign: "center",
                  }}
                >
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
              <RouteCard
                route={route}
                count={route.points}
                destinations={destinations}
                key={idx}
              />
            ))}
          </Stack>
        </Flex>
      </>
      <Stack
        css={{
          height: 40,
          width: "100%",
          textAlign: "center",
          position: "fixed",
          background: "white",
          paddingTop: 8,
          borderTop: "1px solid black",
          overflow: "scroll",
          bottom: 0,
        }}
      >
        {events?.map((event) => (
          <div>{event.message}</div>
        ))}
      </Stack>
    </Stack>
  );
}
