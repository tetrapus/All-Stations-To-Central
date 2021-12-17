import { Link } from "react-router-dom";
import {
  useCollectionData,
  useDocumentData,
} from "react-firebase-hooks/firestore";

import { collectionRef } from "init/firebase";
import { GameConverter, PlayerConverter } from "data/Game";
import { orderBy, query } from "@firebase/firestore";
import useLocalStorage from "@rehooks/local-storage";
import React, { useState } from "react";
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

/**
 * TODO:
 *
 * Ferries
 * Tunnels
 * Rich Event Feed
 * Sounds
 * Map Presets
 * Special Rules
 * Rules Explainer
 * Rainbow Route Color Selection
 * Background Generation
 *
 * BUGS
 * Can't leave in the middle of a game
 * Should be able to easily find destinations
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
    query(collectionRef("games", id, "events"), orderBy("timestamp", "desc"))
  ); // todo: loading

  const [username] = useLocalStorage<string>("username");

  const [highlightedNodes, setHighlightedNodes] = useState<string[]>([]);
  const onHighlight = (route?: Route) => {
    if (!route) return;
    setHighlightedNodes([route.start, route.end]);
  };

  const onUnhighlight = (route?: Route) => {
    if (!route) return;

    setHighlightedNodes([]);
  };

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
      <Stack>
        <PlayerBar players={players} game={game} username={username} />
        {game.finalTurn && game.finalTurn < game.turn && (
          <Scoreboard players={players} game={game}></Scoreboard>
        )}
        {me && <CardBar me={me} game={game} />}
        <Flex>
          <GameBoard
            game={game}
            me={me}
            highlightedNodes={highlightedNodes}
            players={players}
          />
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
        </Flex>
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
    </NavigationContext.Provider>
  );
}
