import styled from "@emotion/styled";
import arrayShuffle from "array-shuffle";
import { Flex } from "atoms/Flex";
import { Stack } from "atoms/Stack";
import { TextButton } from "atoms/TextButton";
import {
  ferryInsignia,
  Game,
  Player,
  trainColors,
  trainPatterns,
} from "data/Game";
import { doc, serverTimestamp } from "firebase/firestore";
import { dijkstra } from "graphology-shortest-path";
import { docRef, collectionRef } from "init/firebase";
import React from "react";
import { fillRepeats } from "util/citygen";
import { getCardCounts } from "util/get-card-counts";
import { isCurrentPlayer } from "util/is-current-player";
import { getMapGraph, getOwnedLines } from "util/lines";
import { range } from "util/range";
import { runPlayerAction } from "util/run-game-action";
import { sortBy } from "util/sort-by";
import { LineSelection } from "./LineSelection";
import { LocomotiveCard } from "./LocomotiveCard";
import { RouteCard } from "./RouteCard";

interface Props {
  me: Player;
  game: Game;
  selectedLine?: LineSelection;
  setSelectedLine(selectedLine?: LineSelection): void;
}

const CardSlotInner = styled(Flex)<{ isFerry: boolean }>({}, ({ isFerry }) => ({
  backgroundImage: isFerry ? ferryInsignia : undefined,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "center",
}));

const CardSlot = styled(Flex)<{
  color: string;
  isFerry: boolean;
}>(
  {
    height: 48,
    width: 32,
    margin: "auto",
    border: "2px solid",
    borderRadius: 2,
    borderStyle: "dashed",
  },
  ({ color, isFerry }) => ({
    borderColor: trainColors[color],
    borderImage: isFerry ? trainColors["rainbow"] : trainColors[color],
    borderImageSlice: 1,
    background: trainPatterns(0.3)[color],
  })
);

const CardSlotContainer = styled(Flex)<{ isForTunnel?: boolean }>(
  {
    height: 64,
    width: 48,
    margin: 5,
    borderRadius: 2,
    cursor: "pointer",
  },
  ({ isForTunnel }) => ({
    background: isForTunnel ? "#ccc" : "black",
  })
);

const CardSelector = ({
  color,
  selection,
  isFerry,
  isForTunnel,
  onClick,
}: {
  color: string;
  selection?: string;
  isFerry: boolean;
  isForTunnel?: boolean;
  onClick(): void;
}) => {
  if (selection) {
    return (
      <LocomotiveCard color={selection} onClick={onClick} clickable={true} />
    );
  }
  return (
    <CardSlotContainer isForTunnel={isForTunnel} onClick={onClick}>
      <CardSlot color={color} isFerry={isFerry}>
        <CardSlotInner isFerry={isFerry} />
      </CardSlot>
    </CardSlotContainer>
  );
};

const popDeck = (game: Game) => {
  const newCard = game.boardState.carriages.deck.pop();
  if (!newCard) {
    throw new Error("Game state broken");
  }
  if (!game.boardState.carriages.deck.length) {
    game.boardState.carriages.deck = game.boardState.carriages.discard;
    if (!game.boardState.carriages.deck.length && game.map) {
      game.boardState.carriages.deck = fillRepeats(game?.map.deck, (color) => ({
        color,
      }));
    }
    game.boardState.carriages.discard = [];
  }
  return newCard;
};

const BuildButton = styled(TextButton)({ fontSize: 16 }, ({ disabled }) =>
  disabled
    ? {
        background: "transparent",
        borderColor: "transparent",
        boxShadow: "none",
        color: "black",
      }
    : { cursor: "pointer" }
);

export function CardBar({ me, game, selectedLine, setSelectedLine }: Props) {
  if (!game.map) {
    return null;
  }

  const lineColor = selectedLine
    ? selectedLine.line.color[selectedLine.colorNo]
    : undefined;
  const requiredColor = selectedLine
    ? lineColor === "rainbow"
      ? selectedLine.selection.find((selection) => selection !== "rainbow")
      : lineColor
    : undefined;

  const getUnselectedCardCounts = (me: Player, selection?: string[]) =>
    sortBy(
      getCardCounts(me)
        .map(([card, count]): [string, number] =>
          selection
            ? [
                card,
                count -
                  (selection.filter((selection) => card === selection).length ||
                    0),
              ]
            : [card, count]
        )
        .filter(([_, count]) => count),
      ([_, count]) => count
    );

  return (
    <Flex
      css={{
        height: 100,
        alignItems: "center",
        "& > *": {
          width: "33%",
        },
      }}
    >
      <Flex css={{ marginRight: "auto" }}>
        {me
          ? getUnselectedCardCounts(me, selectedLine?.selection).map(
              ([card, count], idx) => {
                let canSelect =
                  !!selectedLine &&
                  count > 0 &&
                  selectedLine.selection.length <
                    selectedLine.line.length +
                      (selectedLine.line.isTunnel ? 3 : 0);
                if (card !== "rainbow" && selectedLine) {
                  // Rule 1: If you are building a ferry, you must start with rainbows
                  if (
                    selectedLine.selection.length < selectedLine.line.ferries
                  ) {
                    canSelect = false;
                  }
                  // Rule 2: If the line has a color, we must use it
                  if (requiredColor && card !== requiredColor) {
                    canSelect = false;
                  }
                }
                return (
                  <LocomotiveCard
                    key={idx}
                    color={card}
                    count={count}
                    clickable={canSelect}
                    onClick={() => {
                      if (canSelect && selectedLine) {
                        setSelectedLine({
                          ...selectedLine,
                          selection: [...selectedLine.selection, card],
                        });
                      }
                    }}
                  ></LocomotiveCard>
                );
              }
            )
          : null}
      </Flex>
      <Flex>
        {selectedLine && (
          <Stack css={{ margin: "auto", alignItems: "center" }}>
            <Flex css={{ margin: "auto" }}>
              {range(
                selectedLine.line.length + (selectedLine.line.isTunnel ? 3 : 0)
              ).map((idx) => (
                <CardSelector
                  key={idx}
                  color={requiredColor || "rainbow"}
                  selection={selectedLine.selection[idx]}
                  isFerry={idx < selectedLine.line.ferries}
                  isForTunnel={idx >= selectedLine.line.length}
                  onClick={() => {
                    if (selectedLine.selection[idx]) {
                      if (
                        selectedLine.selection[idx] === "rainbow" &&
                        selectedLine.selection.filter(
                          (selection) => selection === "rainbow"
                        ).length -
                          1 <
                          selectedLine.line.ferries &&
                        selectedLine.selection.find(
                          (selection) => selection !== "rainbow"
                        )
                      ) {
                        return;
                      }
                      const newSelection = [...selectedLine.selection];
                      newSelection.splice(idx, 1);
                      setSelectedLine({
                        ...selectedLine,
                        selection: newSelection,
                      });
                    } else {
                      const newCards: string[] = [];
                      while (
                        idx >=
                        selectedLine.selection.length + newCards.length
                      ) {
                        const updatedCounts = getUnselectedCardCounts(me, [
                          ...selectedLine.selection,
                          ...newCards,
                        ]);
                        const updatedRequiredColor = selectedLine
                          ? lineColor === "rainbow"
                            ? [...selectedLine.selection, ...newCards].find(
                                (selection) => selection !== "rainbow"
                              )
                            : lineColor
                          : undefined;
                        if (
                          selectedLine.line.ferries >
                          selectedLine.selection.length + newCards.length
                        ) {
                          if (
                            updatedCounts.find(([card]) => card === "rainbow")
                          ) {
                            newCards.push("rainbow");
                          } else {
                            return;
                          }
                        } else if (
                          !updatedRequiredColor ||
                          updatedRequiredColor === "rainbow"
                        ) {
                          // pick the most common in hand
                          if (!updatedCounts.length) {
                            return;
                          }
                          const [card] = sortBy(
                            updatedCounts,
                            ([_, count]) => count
                          )[0];
                          newCards.push(card);
                        } else if (updatedRequiredColor) {
                          if (
                            updatedCounts.find(
                              ([card]) => card === updatedRequiredColor
                            )
                          ) {
                            newCards.push(updatedRequiredColor);
                          } else if (
                            updatedCounts.find(([card]) => card === "rainbow")
                          ) {
                            newCards.push("rainbow");
                          } else {
                            return;
                          }
                        } else {
                          return;
                        }
                      }
                      setSelectedLine({
                        ...selectedLine,
                        selection: [...selectedLine.selection, ...newCards],
                      });
                    }
                  }}
                />
              ))}
            </Flex>

            <BuildButton
              disabled={
                selectedLine.selection.length < selectedLine.line.length &&
                isCurrentPlayer(game, me)
              }
              onClick={async () => {
                await runPlayerAction(
                  game,
                  me,
                  async ({ game, me, transaction }) => {
                    if (
                      !(
                        selectedLine.selection.length >=
                          selectedLine.line.length && isCurrentPlayer(game, me)
                      )
                    ) {
                      return;
                    }

                    // TODO: Tunnel Animation
                    const challenge = [];
                    let requiredCards = selectedLine.line.length;
                    if (selectedLine.line.isTunnel) {
                      challenge.push(
                        popDeck(game),
                        popDeck(game),
                        popDeck(game)
                      );
                      const challengeColor =
                        selectedLine.selection.find(
                          (selection) => selection !== "rainbow"
                        ) || "rainbow";
                      requiredCards += challenge.filter(
                        (color) =>
                          color.color === challengeColor ||
                          color.color === "rainbow"
                      ).length;
                      game.boardState.carriages.discard.push(...challenge);
                    }
                    if (requiredCards > selectedLine.selection.length) {
                      await transaction.update(docRef("games", game.id), {
                        "boardState.carriages.discard":
                          game.boardState.carriages.discard,
                        turn: game.turn + 1,
                        turnState: "choose",
                      });
                      await transaction.set(
                        doc(collectionRef("games", game.id, "events")),
                        {
                          author: me.name,
                          timestamp: serverTimestamp(),
                          message: `${me.name} attempted to claim ${selectedLine.line.start} to ${selectedLine.line.end}, but didn't have enough cards.`,
                        }
                      );
                      return;
                    }
                    const usedCards = selectedLine.selection.slice(
                      0,
                      requiredCards
                    );
                    // Return the rest to the hand
                    game.boardState.carriages.discard.push(
                      ...selectedLine.selection
                        .slice(selectedLine.line.length)
                        .map((color) => ({ color }))
                    );

                    await transaction.update(docRef("games", game.id), {
                      [`boardState.lines.${selectedLine.lineNo}.${selectedLine.colorNo}`]:
                        me.name,
                      "boardState.carriages.discard":
                        game.boardState.carriages.discard,
                      turn: game.turn + 1,
                      turnState: "choose",
                    });
                    if (me.trainCount - usedCards.length <= 2) {
                      // Final turn triggered!!!
                      await transaction.update(docRef("games", game.id), {
                        finalTurn: game.turn + game.playerCount - 1,
                      });
                    }
                    // Update any won routes
                    const graph = getMapGraph(game.map);
                    const ownedLines = getOwnedLines(me, game);
                    graph.addEdge(
                      selectedLine.line.start,
                      selectedLine.line.end
                    );

                    ownedLines.forEach((line) =>
                      graph.addEdge(line.start, line.end)
                    );
                    const routes = me.routes.map((route) => ({
                      ...route,
                      won:
                        route.won ||
                        !!dijkstra.bidirectional(graph, route.start, route.end),
                    }));
                    await transaction.update(
                      docRef("games", game.id, "players", me.name),
                      {
                        trainCount: me.trainCount - selectedLine.line.length,
                        hand: fillRepeats(
                          Object.fromEntries(
                            getUnselectedCardCounts(me, usedCards)
                          ),
                          (color) => ({ color })
                        ),
                        routes: routes,
                      }
                    );
                    await transaction.set(
                      doc(collectionRef("games", game.id, "events")),
                      {
                        author: me.name,
                        timestamp: serverTimestamp(),
                        message: `${me.name} claimed ${selectedLine.line.start} to ${selectedLine.line.end}`,
                      }
                    );
                  }
                );
                setSelectedLine(undefined);
              }}
            >
              Build {selectedLine.line.color[selectedLine.colorNo]}{" "}
              {selectedLine.line.isTunnel
                ? "tunnel"
                : selectedLine.line.ferries
                ? "ferry"
                : "line"}{" "}
              from <strong>{selectedLine.line.start}</strong> to{" "}
              <strong>{selectedLine.line.end}</strong>
            </BuildButton>
          </Stack>
        )}
      </Flex>
      <Flex css={{ justifyContent: "flex-end" }}>
        {game.boardState.carriages.faceUp?.map((card, idx) => (
          <LocomotiveCard
            key={idx}
            color={card.color}
            clickable={
              (game.turnState === "choose" || game.turnState === "drawn") &&
              game.isReady &&
              isCurrentPlayer(game, me)
            }
            onClick={() => {
              runPlayerAction(game, me, async ({ game, me, transaction }) => {
                if (
                  isCurrentPlayer(game, me) &&
                  (game?.turnState === "choose" || game?.turnState === "drawn")
                ) {
                  const newCard = game.boardState.carriages.deck.pop();
                  if (!newCard) {
                    throw new Error("Game state broken");
                  }
                  if (!game.boardState.carriages.deck.length) {
                    game.boardState.carriages.deck =
                      game.boardState.carriages.discard;
                    if (!game.boardState.carriages.deck.length && game.map) {
                      game.boardState.carriages.deck = fillRepeats(
                        game?.map.deck,
                        (color) => ({ color })
                      );
                    }
                    game.boardState.carriages.discard = [];
                  }
                  game.boardState.carriages.faceUp.splice(idx, 1, newCard);
                  // TODO: Rainbow Refresh rule
                  // TODO: Cannot draw rainbow on 'drawn' phase rule
                  const newTurn =
                    game.turnState === "drawn" || card.color === "rainbow";
                  transaction.update(docRef("games", game.id), {
                    "boardState.carriages.deck": game.boardState.carriages.deck,
                    "boardState.carriages.discard":
                      game.boardState.carriages.discard,
                    "boardState.carriages.faceUp":
                      game.boardState.carriages.faceUp,
                    turn: newTurn ? game.turn + 1 : game.turn,
                    turnState: newTurn ? "choose" : "drawn",
                  });
                  transaction.update(
                    docRef("games", game.id, "players", me.name),
                    {
                      hand: [...me.hand, card],
                    }
                  );
                  await transaction.set(
                    doc(collectionRef("games", game.id, "events")),
                    {
                      author: me.name,
                      timestamp: serverTimestamp(),
                      message: `${me.name} drew a card`,
                    }
                  );
                }
              });
            }}
          ></LocomotiveCard>
        ))}
        <LocomotiveCard
          count={game.boardState.carriages.deck.length}
          clickable={
            (game.turnState === "choose" || game.turnState === "drawn") &&
            game.isReady &&
            isCurrentPlayer(game, me)
          }
          onClick={() => {
            runPlayerAction(game, me, async ({ game, me, transaction }) => {
              if (
                isCurrentPlayer(game, me) &&
                (game.turnState === "choose" || game.turnState === "drawn")
              ) {
                const newCard = game.boardState.carriages.deck.pop();
                if (!newCard) {
                  throw new Error("Game state broken");
                }
                if (!game.boardState.carriages.deck.length) {
                  game.boardState.carriages.deck =
                    game.boardState.carriages.discard;
                  if (!game.boardState.carriages.deck.length && game.map) {
                    game.boardState.carriages.deck = fillRepeats(
                      game?.map.deck,
                      (color) => ({ color })
                    );
                  }
                  game.boardState.carriages.discard = [];
                }
                const newTurn = game.turnState === "drawn";
                transaction.update(docRef("games", game.id), {
                  "boardState.carriages.deck": game.boardState.carriages.deck,
                  "boardState.carriages.discard":
                    game.boardState.carriages.discard,
                  turn: newTurn ? game.turn + 1 : game.turn,
                  turnState: newTurn ? "choose" : "drawn",
                });
                transaction.update(
                  docRef("games", game.id, "players", me.name),
                  {
                    hand: [...me.hand, newCard],
                  }
                );
                await transaction.set(
                  doc(collectionRef("games", game.id, "events")),
                  {
                    author: me.name,
                    timestamp: serverTimestamp(),
                    message: `${me.name} drew a card`,
                  }
                );
              }
            });
          }}
        ></LocomotiveCard>
        <RouteCard
          count={game.boardState.routes.deck.length}
          clickable={isCurrentPlayer(game, me) && game.turnState === "choose"}
          map={game.map}
          onClick={() => {
            runPlayerAction(game, me, async ({ game, me, transaction }) => {
              if (isCurrentPlayer(game, me) && game.turnState !== "choose") {
                if (game.boardState.routes.deck.length <= 3) {
                  game.boardState.routes.deck = [
                    ...game.boardState.routes.deck,
                    ...arrayShuffle(game.boardState.routes.discard),
                  ];
                  game.boardState.routes.discard = [];
                }
                if (!game.boardState.routes.deck.length) {
                  return;
                }
                await transaction.update(
                  docRef("games", game.id, "players", me.name),
                  {
                    "routeChoices.routes": range(
                      Math.min(3, game.boardState.routes.deck.length)
                    ).map(() => game.boardState.routes.deck.pop()),
                    "routeChoices.keepMin": 1,
                  }
                );
                await transaction.update(docRef("games", game.id), {
                  "boardState.routes.deck": game.boardState.routes.deck,
                  "boardState.routes.discard": game.boardState.routes.discard,
                  turnState: "routes-taken",
                });
                await transaction.set(
                  doc(collectionRef("games", game.id, "events")),
                  {
                    author: me.name,
                    timestamp: serverTimestamp(),
                    message: `${me.name} took 3 routes`,
                  }
                );
              }
            });
          }}
        />
      </Flex>
    </Flex>
  );
}
