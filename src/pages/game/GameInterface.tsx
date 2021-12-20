import TimeAgo from "react-timeago";

import { Link } from "react-router-dom";
import {
  useCollectionData,
  useDocumentData,
} from "react-firebase-hooks/firestore";

import { collectionRef } from "init/firebase";
import { GameConverter, PlayerConverter } from "data/Game";
import { orderBy, query } from "@firebase/firestore";
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

/**
 * TODO:
 *
 * Leave mid-game
 * Name changes
 * Stations
 * Rainbow Refresh Rule
 * Train Count Selection / Balancing
 * Rich Event Feed
 * Sounds
 * Map Presets
 * AI Players
 * Special Rules
 * Rules Explainer
 * Background Generation
 *
 * BUGS
 * Should be able to easily find destinations
 * Prevent claiming both routes for dual route trains
 **/

export function GameInterface() {
  const { id } = useParams<{ id: string }>();

  const [game, gameLoading] = useDocumentData(
    docRef("games", id).withConverter(GameConverter)
  ); // todo: error

  const [players, playersLoading] = useCollectionData(
    collectionRef("games", id, "players").withConverter(PlayerConverter)
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

    if (game.boardState.lines[selectedLine.lineNo]?.[selectedLine.colorNo]) {
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
            maxHeight: "calc(100vh - 74px - 78px - 28px)",
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
              setSelectedLine({ line, colorNo, lineNo, selection: [] })
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
                    game={game}
                    me={me}
                  />
                </Stack>
              ) : null}
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
          </Stack>
        </Flex>
      </Stack>
    </NavigationContext.Provider>
  );
}
