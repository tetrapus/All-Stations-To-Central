import arrayShuffle from "array-shuffle";
import { Breakpoint } from "atoms/Breakpoint";
import { Flex } from "atoms/Flex";
import { Stack } from "atoms/Stack";
import { TextButton } from "atoms/TextButton";
import { Game, Player } from "data/Game";
import { doc, serverTimestamp } from "firebase/firestore";
import { docRef, collectionRef } from "init/firebase";
import React from "react";
import { fillRepeats } from "util/citygen";
import { generateColor } from "util/colorgen";
import { runGameAction, runPlayerAction } from "util/run-game-action";
import { MoveTimer } from "./MoveTimer";
import { PlayerColor } from "./PlayerColor";
import { ScoreCard } from "./ScoreCard";

interface Props {
  players?: Player[];
  game: Game;
  username: string;
}

export function PlayerBar({ players, game, username }: Props) {
  const currentPlayer =
    !players || (game.finalTurn && game.turn > game.finalTurn)
      ? undefined
      : players[game.turn % players.length];

  const me = players?.find((player) => player.name === username);

  return (
    <Flex
      css={{
        [Breakpoint.MOBILE]: {
          flexDirection: "column-reverse",
        },
      }}
    >
      <Flex css={{ marginRight: "auto", overflow: "scroll" }}>
        {players?.map((player) => {
          return (
            <Flex
              css={{
                border: "1px solid",
                margin: 3,
                position: "relative",
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
                  (game.turn - currentPlayer.order + player.order < game.turn ||
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
                <MoveTimer
                  game={game}
                  me={me}
                  playerNo={player.order}
                ></MoveTimer>
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
      <Flex css={{ alignItems: "center" }}>
        {!game.isStarted ? (
          players?.find((player) => player.name === username) ? (
            <TextButton
              css={{ margin: 8 }}
              onClick={async (event) => {
                if (!me) {
                  return;
                }
                await runPlayerAction(
                  game,
                  me,
                  async ({ game, me, transaction }) => {
                    await transaction.delete(
                      docRef("games", game.id, "players", me.name)
                    );
                    await transaction.update(docRef("games", game.id), {
                      playerCount: game.playerCount - 1,
                    });
                    await transaction.set(
                      doc(collectionRef("games", game.id, "events")),
                      {
                        author: username,
                        timestamp: serverTimestamp(),
                        message: `${username} left the game`,
                      }
                    );
                  }
                );
              }}
            >
              Leave Game
            </TextButton>
          ) : (
            <TextButton
              css={{ margin: 8 }}
              onClick={async (event) => {
                await runGameAction(game, async ({ game, transaction }) => {
                  await transaction.update(docRef("games", game.id), {
                    playerCount: game.playerCount + 1,
                  });
                  await transaction.set(
                    docRef("games", game.id, "players", username),
                    {
                      name: username,
                      order: game.playerCount,
                      hand: [],
                      color: generateColor(),
                      routes: [],
                      trainCount: 45,
                      stationCount: 0,
                      isReady: false,
                    }
                  );
                  await transaction.set(
                    doc(collectionRef("games", game.id, "events")),
                    {
                      author: username,
                      timestamp: serverTimestamp(),
                      message: `${username} joined the game`,
                    }
                  );
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
        {!game.isStarted && game.map && me ? (
          <TextButton
            css={{ margin: 8 }}
            onClick={async () => {
              await runPlayerAction(
                game,
                me,
                async ({ game, me, transaction }) => {
                  if (game.isStarted) {
                    return;
                  }
                  const map = game?.map;
                  if (!map || !players) {
                    return;
                  }
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
                      docRef("games", game.id, "players", players[i].name),
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
                  await transaction.update(docRef("games", game.id), {
                    "boardState.carriages.deck": carriages,
                    "boardState.carriages.faceUp": faceUp,
                    "boardState.routes.deck": routes,
                    isStarted: true,
                    map: map,
                    turnState: "choose",
                  });
                  await transaction.set(
                    doc(collectionRef("games", game.id, "events")),
                    {
                      author: username,
                      timestamp: serverTimestamp(),
                      message: `${username} began the game`,
                    }
                  );
                }
              );
            }}
          >
            Start Game
          </TextButton>
        ) : null}
      </Flex>
      {game.map && <ScoreCard map={game.map} />}
    </Flex>
  );
}
