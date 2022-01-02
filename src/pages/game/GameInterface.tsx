import { Game, Player } from "data/Game";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Stack } from "atoms/Stack";
import { Route } from "../../data/Game";
import { Scoreboard } from "./Scoreboard";
import { PlayerBar } from "./PlayerBar";
import { NavigationContext } from "../../data/NavigationContext";
import { CardBar } from "./card-bar/CardBar";
import { GameBoard } from "./board/GameBoard";
import { Flex } from "atoms/Flex";
import { LineSelection } from "./LineSelection";
import { Breakpoint } from "atoms/Breakpoint";
import { ActionBar } from "./ActionBar";
import { EventFeed } from "./EventFeed";
import { RouteBar } from "./RouteBar";
import { EngineContext, GameEngine, PlayerEngine } from "util/game-engine";
import { PlayerView } from "./PlayerView";

/**
 * TODO:
 *
 * Rules Explainer
 *  - [ ] In-game modal
 * Bonus Cards
 *  - [ ] European Express (Cross-Country): Longest Path
 * Destination Selector
 *  - [ ] Scroll into view if needed
 * Loading states
 * Rainbow Refresh Rule
 * Rich Event Feed
 * Sounds
 * Map Presets
 * AI Players
 * Special Rules
 * Background Generation
 * Name changes
 *
 * BUGS
 * Prevent claiming both routes for dual route trains
 * movetimer randomly breaks? maybe to do with removed players
 * move timer probably broken with route selection
 **/

interface Props {
  game: Game;
  players: Player[];
  username: string;
  id: string;
}

export function GameInterface({ game, players, username, id }: Props) {
  const me = players
    ? players.find((player) => player.name === username)
    : undefined;

  const engine = useMemo(() => {
    if (me) {
      return new PlayerEngine(game, players, me);
    } else {
      return new GameEngine(game, players);
    }
  }, [game, me, players]);

  const [highlightedNodes, setHighlightedNodes] = useState<string[]>([]);

  const onHighlight = useCallback(
    (route?: Route) => {
      if (!route) return;
      setHighlightedNodes([...highlightedNodes, route.start, route.end]);
    },
    [highlightedNodes]
  );

  const onUnhighlight = useCallback(
    (route?: Route) => {
      if (!route) return;
      const toRemove = [
        highlightedNodes.indexOf(route.start),
        highlightedNodes.indexOf(route.end),
      ];
      setHighlightedNodes(
        highlightedNodes.filter((node, idx) => !toRemove.includes(idx))
      );
    },
    [highlightedNodes]
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
      selectedLine.type === "city" &&
      game.boardState.stations.owners[selectedLine.city] !== undefined
    ) {
      setSelectedLine(undefined);
    }
  }, [game, selectedLine]);

  return (
    <EngineContext.Provider value={engine}>
      <NavigationContext.Provider value={{ onHighlight, onUnhighlight }}>
        <Stack css={{ height: "100vh" }}>
          <PlayerBar username={username} />
          {engine.isEnded() ? <Scoreboard /> : null}
          {engine.isStarted() ? (
            <CardBar
              selectedLine={selectedLine}
              setSelectedLine={setSelectedLine}
            />
          ) : null}
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
              highlightedNodes={highlightedNodes}
              selectedLine={selectedLine}
              setSelectedLine={setSelectedLine}
            />
            <Stack css={{ marginTop: 16, flexGrow: 1 }}>
              <PlayerView>
                <RouteBar />
              </PlayerView>
              <EventFeed id={id} />
              <PlayerView>
                <ActionBar />
              </PlayerView>
            </Stack>
          </Flex>
        </Stack>
      </NavigationContext.Provider>
    </EngineContext.Provider>
  );
}
