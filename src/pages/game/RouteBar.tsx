import { Breakpoint } from "atoms/Breakpoint";
import { Stack } from "atoms/Stack";
import React from "react";
import { useEngine, PlayerEngineContext } from "util/game-engine";
import { RouteCard } from "./RouteCard";
import { RouteChoices } from "./RouteChoices";

export function RouteBar() {
  const engine = useEngine(PlayerEngineContext);
  const { game, me } = engine.getState();

  return (
    <Stack
      css={{
        marginBottom: 8,
        overflow: "scroll",
        [Breakpoint.MOBILE]: {
          flexDirection: "row",
        },
      }}
    >
      {me.routeChoices && !(game.finalTurn && game.finalTurn < game.turn) && (
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
            maxDiscard={me.routeChoices.routes.length - me.routeChoices.keepMin}
            game={game}
            me={me}
          />
        </Stack>
      )}
      {me.routes.map((route, idx) => (
        <RouteCard
          route={route}
          count={route.points}
          map={game.map}
          key={idx}
        />
      ))}
    </Stack>
  );
}
