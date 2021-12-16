import { Flex } from "atoms/Flex";
import { Stack } from "atoms/Stack";
import { CELL_SIZE } from "data/Board";
import { GameMap, Route } from "data/Game";
import React from "react";
import { sortBy } from "util/sort-by";
import { indexBy } from "util/index-by";

interface Props {
  count?: number;
  route?: Route;
  clickable?: boolean;
  map: GameMap;
  onClick?: () => void;
  onHighlight?: (route?: Route) => void;
  onUnhighlight?: (route?: Route) => void;
}

export const RouteCard = ({
  count,
  route,
  clickable,
  onClick,
  onHighlight,
  onUnhighlight,
  map,
}: Props) => {
  const destinations = indexBy(map.destinations, "name");
  const mapSize = map.size;
  const ends = route
    ? sortBy([route.start, route.end], (name) => destinations[name].position.y)
    : undefined;
  return (
    <Stack
      css={{
        alignItems: "center",
        textAlign: "center",
        fontSize: 13,
        margin: 4,
        cursor: clickable ? "pointer" : undefined,
      }}
      onClick={onClick}
      onMouseEnter={() => {
        onHighlight?.(route);
      }}
      onMouseLeave={() => {
        onUnhighlight?.(route);
      }}
    >
      <Flex>{ends ? ends[1] : null}</Flex>
      <Flex
        css={{
          background:
            route && route.won
              ? "#2f6543"
              : count && count < 0
              ? "darkred"
              : "#333",
          width: 64,
          height: 36,
          borderRadius: 2,
          color: "white",
          fontWeight: "bold",
          position: "relative",
        }}
      >
        {route ? (
          <>
            <div
              css={{
                background: "orange",
                width: 6,
                height: 6,
                borderRadius: 3,
                position: "absolute",
                left: `${
                  ((destinations[route.start].position.x * CELL_SIZE) /
                    mapSize.width) *
                  100
                }%`,
                top: `${
                  ((destinations[route.start].position.y * CELL_SIZE) /
                    mapSize.height) *
                  100
                }%`,
              }}
            ></div>
            <div
              css={{
                background: "orange",
                width: 6,
                height: 6,
                borderRadius: 3,
                position: "absolute",
                left: `${
                  ((destinations[route.end].position.x * CELL_SIZE) /
                    mapSize.width) *
                  100
                }%`,
                top: `${
                  ((destinations[route.end].position.y * CELL_SIZE) /
                    mapSize.height) *
                  100
                }%`,
              }}
            ></div>
          </>
        ) : null}
        <div css={{ margin: "auto", zIndex: 1 }}>{count}</div>
      </Flex>
      <Flex>{ends ? ends[0] : "Routes"}</Flex>
    </Stack>
  );
};
