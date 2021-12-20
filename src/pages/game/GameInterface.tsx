import TimeAgo from "react-timeago";

import { Link } from "react-router-dom";
import {
  useCollectionData,
  useDocumentData,
} from "react-firebase-hooks/firestore";

import { collectionRef } from "init/firebase";
import { Game, GameConverter, Player, PlayerConverter } from "data/Game";
import { FieldValue, orderBy, query } from "@firebase/firestore";
import useLocalStorage from "@rehooks/local-storage";
import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router";
import { TextButton } from "atoms/TextButton";
import { docRef } from "init/firebase";
import { Stack } from "atoms/Stack";
import { Route } from "../../data/Game";
import { Scoreboard } from "./Scoreboard";
import { PlayerBar } from "./PlayerBar";
import { NavigationContext } from "./NavigationContext";
import { CardBar } from "./CardBar";
import { GameBoard } from "./GameBoard";
import { RouteChoices } from "./RouteChoices";
import { Flex } from "atoms/Flex";
import { RouteCard } from "./RouteCard";
import { LineSelection } from "./LineSelection";
import { GameEventConverter } from "data/GameEvent";
import { Breakpoint } from "atoms/Breakpoint";
import { runGameAction, runPlayerAction } from "util/run-game-action";
import { getNextTurn } from "util/next-turn";

/**
 * TODO:
 *
 * Bonus Cards
 *  - Globetrotter: Most Destination Cards
 *  - European Express (Cross-Country): Longest Path
 * Stations
 *  - Add cardbar support
 *  - Add station selector and indicator
 *  - [x] Add player stats support
 *  - [x] Add to scoring breakdown
 *  - Add to default start conditions
 * Rainbow Refresh Rule
 * Rich Event Feed
 * Sounds
 * Map Presets
 * AI Players
 * Special Rules
 * Rules Explainer
 * Background Generation
 * Name changes
 *
 * BUGS
 * Prevent claiming both routes for dual route trains
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
    query(
      collectionRef("games", id, "events").withConverter(GameEventConverter),
      orderBy("timestamp", "desc")
    )
  ); // todo: loading

  const [username] = useLocalStorage<string>("username");

  const [highlightedNodes, setHighlightedNodes] = useState<string[]>([]);

  const onHighlight = useCallback(
    (route?: Route) => {
      if (!route) return;
      setHighlightedNodes([route.start, route.end]);
    },
    [setHighlightedNodes]
  );

  const onUnhighlight = useCallback(
    (route?: Route) => {
      if (!route) return;

      setHighlightedNodes([]);
    },
    [setHighlightedNodes]
  );

  const [selectedLine, setSelectedLine] = useState<LineSelection | undefined>();

  // Once a line gets snapped up we must unselect it
  useEffect(() => {
    if (!selectedLine || !game) return;

    if (
      selectedLine.type === "line" &&
      game.boardState.lines[selectedLine.lineNo]?.[selectedLine.colorNo] !==
        undefined
    ) {
      setSelectedLine(undefined);
    } else if (
      selectedLine.type === "station" &&
      game.boardState.stations[selectedLine.city] !== undefined
    ) {
      setSelectedLine(undefined);
    }
  }, [game, selectedLine]);

  const map = game?.map;

  if (!username || !players || !map) {
    return null;
  }

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

  return (
    <NavigationContext.Provider value={{ onHighlight, onUnhighlight }}>
      <Stack css={{ height: "100vh" }}>
        <PlayerBar players={players} game={game} username={username} />
        {game.finalTurn && game.finalTurn < game.turn && (
          <Scoreboard players={players} game={game}></Scoreboard>
        )}
        {me && (
          <CardBar
            me={me}
            game={game}
            selectedLine={selectedLine}
            setSelectedLine={setSelectedLine}
          />
        )}
        <Flex
          css={{
            flexGrow: 1,
            maxHeight: "calc(100vh - 74px - 78px)",
            [Breakpoint.MOBILE]: {
              maxHeight: "100vh",
              flexDirection: "column",
            },
          }}
        >
          <GameBoard
            game={game}
            me={me}
            highlightedNodes={highlightedNodes}
            players={players}
            onLineSelected={(line, lineNo, colorNo) =>
              setSelectedLine({
                line,
                colorNo,
                lineNo,
                selection: [],
                type: "line",
              })
            }
            selectedLine={selectedLine}
          />
          <Stack css={{ marginTop: 16, flexGrow: 1 }}>
            <Stack
              css={{
                marginBottom: 8,
                overflow: "scroll",
                [Breakpoint.MOBILE]: {
                  flexDirection: "row",
                },
              }}
            >
              {me?.routeChoices &&
                !(game.finalTurn && game.finalTurn < game.turn) && (
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
                      game={game}
                      me={me}
                    />
                  </Stack>
                )}
              {me?.routes.map((route, idx) => (
                <RouteCard
                  route={route}
                  count={route.points}
                  map={map}
                  key={idx}
                />
              ))}
            </Stack>
            <Stack
              css={{
                height: 150,
                textAlign: "center",
                padding: "8px 8px 8px 0px",
                marginTop: "auto",
                borderTop: "1px solid black",
                overflow: "scroll",
              }}
            >
              {events?.map((event) => (
                <div>
                  {" "}
                  <TimeAgo
                    date={event.timestamp.toDate()}
                    css={{ color: "grey", fontSize: 10 }}
                  />
                  <div css={{ fontSize: 12 }}>{event.message}</div>
                </div>
              ))}
            </Stack>
            {me &&
              game.isStarted &&
              !(game.finalTurn && game.finalTurn < game.turn) && (
                <Flex css={{ margin: "8px 4px" }}>
                  <TextButton
                    css={{ fontSize: 14, margin: "auto" }}
                    onClick={() => {
                      runPlayerAction(
                        game,
                        me,
                        async ({ game, me, transaction }) => {
                          if (game.removedPlayers.includes(me.order)) {
                            return;
                          }
                          let gameUpdates: Partial<
                            Omit<Game, "turnStart"> & { turnStart: FieldValue }
                          > & { removedPlayers: number[] } = {
                            removedPlayers: [...game.removedPlayers, me.order],
                          };
                          let playerUpdates: Partial<Player> = {};
                          // Am I ready?
                          if (!me.isReady) {
                            gameUpdates.readyCount = game.readyCount + 1;
                            playerUpdates.isReady = true;
                          }
                          // Is it my turn?
                          if (game.turn % game.playerCount === me.order) {
                            gameUpdates = {
                              ...gameUpdates,
                              ...getNextTurn(game, true),
                            };
                          }
                          // Am I the last player?
                          if (
                            gameUpdates.removedPlayers.length >=
                            game.playerCount
                          ) {
                            gameUpdates.finalTurn = game.turn - 1;
                          }
                          await transaction.update(
                            docRef("games", game.id),
                            gameUpdates
                          );
                          await transaction.update(
                            docRef("games", game.id, "players", me.name),
                            playerUpdates
                          );
                        }
                      );
                    }}
                  >
                    Leave
                  </TextButton>
                  <TextButton
                    css={{ fontSize: 14, margin: "auto" }}
                    onClick={() => {
                      runGameAction(game, async ({ game, transaction }) => {
                        transaction.update(docRef("games", game.id), {
                          finalTurn: game.turn - 1,
                          isReady: true,
                        });
                      });
                    }}
                  >
                    End Game
                  </TextButton>
                </Flex>
              )}
          </Stack>
        </Flex>
      </Stack>
    </NavigationContext.Provider>
  );
}
