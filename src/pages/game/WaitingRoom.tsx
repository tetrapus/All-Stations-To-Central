import useLocalStorage from "@rehooks/local-storage";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import { TextButton } from "atoms/TextButton";
import { deleteDoc, runTransaction, setDoc } from "@firebase/firestore";
import { Game, Map, Player, TrainColor, trainColors } from "data/Game";
import { db, docRef } from "init/firebase";
import { distance, generateMap } from "../../util/mapgen";
import { Flex } from "atoms/Flex";
import { fillRepeats } from "util/citygen";
import arrayShuffle from "array-shuffle";
import { sortBy } from "util/sort-by";
import { Stack } from "atoms/Stack";
import { playerColors } from "../../data/Game";

interface Props {
  players: Player[];
  game: Game;
}

export function WaitingRoom({ players, game }: Props) {
  const [username] = useLocalStorage<string>("username");
  const { id } = useParams<{ id: string }>();

  const [map, setMap] = useState<Map>();
  useEffect(() => {
    if (!game) return;
    if (game.map) {
      setMap(game.map);
    } else {
      setMap(
        generateMap({
          cities: 30,
          connectivity: 3,
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
  return (
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
                if (game.turnState === "choose" || game.turnState === "drawn") {
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
                    "boardState.carriages.deck": game.boardState.carriages.deck,
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
                  turn: newTurn ? (game.turn + 1) % players.length : game.turn,
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
                    }
                  );
                }
                await transaction.update(docRef("games", id), {
                  "boardState.carriages.deck": carriages,
                  "boardState.carriages.faceUp": faceUp,
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
      <div
        css={{
          width: `${width}vw`,
          height: `${height}vw`,
          background: "#111",
          border: "5px solid black",
          margin: 8,
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
                height: 12,
                width: `${distance(start, end) * 5.6}vw`,
                [":hover"]: {
                  ["--hovercolor"]: playable
                    ? playerColors[currentPlayer.color]
                    : undefined,
                },
              }}
              onClick={() => {
                if (playable) {
                  // TODO: use rainbow, feedback if cannot take
                  runTransaction(db, async (transaction) => {
                    await transaction.update(docRef("games", id), {
                      [`boardState.lines.${lineNo}.${0}`]: currentPlayer.name,
                      turn: (game.turn + 1) % players.length,
                      turnState: "choose",
                    });
                    await transaction.update(
                      docRef("games", id, "players", currentPlayer.name),
                      {
                        trainCount: currentPlayer.trainCount - line.length,
                        hand: fillRepeats(
                          { ...counts, [color]: counts[color] - line.length },
                          (color) => ({ color })
                        ),
                      }
                    );
                  });
                }
              }}
            >
              <Flex css={{ width: "100%", paddingLeft: 12, paddingRight: 12 }}>
                {new Array(line.length).fill(0).map((_, idx) => (
                  <Flex
                    key={idx}
                    css={{
                      borderColor: trainColors[line.color[0]],
                      borderWidth: 2,
                      borderStyle: "solid",
                      margin: "0px 8px 0px 8px",
                      flexGrow: 1,
                      background: game.boardState.lines[lineNo]?.[0]
                        ? players.find(
                            (p) => p.name === game.boardState.lines[lineNo]?.[0]
                          )?.color
                        : "var(--hovercolor)",
                      transform: `translateY(${
                        (16 * line.length) / 2 -
                        Math.abs(
                          (idx + 0.5 - Math.ceil(line.length / 2)) / line.length
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
                borderRadius: 10,
                width: 16,
                height: 16,
                background: "black",
                border: "2px solid grey",
                transform: "translateX(-50%)",
              }}
            ></div>
            <span
              css={{
                background: "rgba(0, 0, 0, 0.5)",
                fontSize: 12,
                maxWidth: "5vw",
              }}
            >
              {destination.name}
            </span>
          </Flex>
        ))}
      </div>
    </>
  );
}
