import { Link } from "react-router-dom";
import {
  useCollectionData,
  useDocumentData,
} from "react-firebase-hooks/firestore";

import { collectionRef } from "init/firebase";
import { GameConverter, PlayerConverter } from "data/Game";
import { orderBy, query } from "@firebase/firestore";
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
import { playerColors, Route } from "../../data/Game";

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
    onClick,
  }: {
    color?: TrainColor;
    count?: number;
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

  const currentPlayer = players[game.turn]; // FIXME
  const cardCounts: [TrainColor, number][] = sortBy(
    Object.keys(trainColors)
      ?.map((color): [string, number] => [
        color,
        currentPlayer.hand.filter((card) => card.color === color).length,
      ])
      .filter(([, count]) => count),
    (v) => v[1]
  );

  const destinations = Object.fromEntries(
    map.destinations.map((city) => [city.name, city])
  );

  const RouteCard = ({ count, route }: { count?: number; route?: Route }) => (
    <Stack css={{ alignItems: "center", fontSize: 13, margin: 4 }}>
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
        <div css={{ margin: "auto" }}>{count}</div>
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
          </>
        ) : null}
      </Flex>
      <Flex>{route ? route.end : "Routes"}</Flex>
    </Stack>
  );

  return (
    <Stack>
      <Flex>
        <Flex css={{ marginRight: "auto" }}>
          {players?.map((player) => (
            <Flex
              key={player.name}
              css={{
                margin: 16,
                fontWeight: player.order === game.turn ? "bold" : "normal",
              }}
            >
              {player.name}
            </Flex>
          ))}
        </Flex>
        <span>
          {players.find((player) => player.name === username) ? (
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
                  color: "", // todo
                  routes: [],
                  trainCount: 45,
                  stationCount: 0,
                };
                await setDoc(docRef("games", id, "players", username), player);
              }}
            >
              Join Game
            </TextButton>
          )}
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
                        routes: [routes.pop(), routes.pop(), routes.pop()],
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
          <Stack css={{ margin: 8 }}>
            <Stack css={{ alignItems: "center", margin: "auto" }}>
              {currentPlayer.trainCount}
              <div
                css={{
                  background: playerColors[currentPlayer.color],
                  height: 10,
                  width: "2vw",
                  border: "1px solid black",
                }}
              ></div>
            </Stack>
          </Stack>
          <Flex css={{ marginRight: "auto" }}>
            {cardCounts?.map(([card, count], idx) => (
              <Card key={idx} color={card} count={count}></Card>
            ))}
          </Flex>
          {game.boardState.carriages.faceUp?.map((card, idx) => (
            <Card
              key={idx}
              color={card.color}
              onClick={() => {
                runTransaction(db, async (transaction) => {
                  if (
                    game.turnState === "choose" ||
                    game.turnState === "drawn"
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
                      turn: newTurn
                        ? (game.turn + 1) % players.length
                        : game.turn,
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
            onClick={() => {
              runTransaction(db, async (transaction) => {
                if (game.turnState === "choose" || game.turnState === "drawn") {
                  const newCard = game.boardState.carriages.deck.pop();
                  if (!newCard) {
                    throw new Error("Game state broken");
                  }
                  const newTurn = game.turnState === "drawn";
                  transaction.update(docRef("games", id), {
                    "boardState.carriages.deck": game.boardState.carriages.deck,
                    turn: newTurn
                      ? (game.turn + 1) % players.length
                      : game.turn,
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
          <RouteCard count={game.boardState.routes.deck.length}></RouteCard>
        </Flex>
        <Flex>
          <div
            css={{
              width: `${width}vw`,
              height: `${height}vw`,
              background: "#222",
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

              const playable =
                game.turnState === "choose" &&
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
                    ":hover": {
                      "--hovercolor": playable
                        ? playerColors[currentPlayer.color]
                        : undefined,
                      cursor: playable ? "pointer" : undefined,
                    },
                    background: game.boardState.lines[lineNo]?.[0]
                      ? players.find(
                          (p) => p.name === game.boardState.lines[lineNo]?.[0]
                        )?.color
                      : undefined,
                  }}
                  onClick={() => {
                    if (playable) {
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
                            game.boardState.carriages.discard,
                            ...discard,
                          ],
                          turn: (game.turn + 1) % players.length,
                          turnState: "choose",
                        });
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
                    maxWidth: "5vw",
                    transform: "translateX(-8px)",
                  }}
                >
                  {destination.name}
                </div>
              </Flex>
            ))}
          </div>
          <Stack css={{ marginLeft: "auto", marginTop: 16 }}>
            {currentPlayer.routes.map((route, idx) => (
              <RouteCard route={route} key={idx} />
            ))}
          </Stack>
        </Flex>
      </>
    </Stack>
  );
}
