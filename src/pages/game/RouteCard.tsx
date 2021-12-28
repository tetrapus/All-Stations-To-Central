import { Flex } from "atoms/Flex";
import { Stack } from "atoms/Stack";
import { CELL_SIZE } from "data/Board";
import { Destination, GameMap, Route } from "data/Game";
import React, { useContext, useState } from "react";
import { sortBy } from "util/sort-by";
import { indexBy } from "util/index-by";
import { NavigationContext } from "../../data/NavigationContext";
import styled from "@emotion/styled";

interface Props {
  count?: number;
  route?: Route;
  clickable?: boolean;
  map: GameMap;
  onClick?: () => void;
}

const CityHint = styled.div<{
  city: Destination;
  map: GameMap;
  highlighted: boolean;
}>(
  {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: "absolute",
  },
  ({ city, map, highlighted }) => ({
    background: highlighted ? "lightgreen" : "orange",
    left: `${((city.position.x * CELL_SIZE) / map.size.width) * 100}%`,
    top: `${((city.position.y * CELL_SIZE) / map.size.height) * 100}%`,
  })
);

export const RouteCard = ({ count, route, clickable, map, onClick }: Props) => {
  const { onHighlight, onUnhighlight } = useContext(NavigationContext);
  const [highlighted, setHighlighted] = useState(false);
  const destinations = indexBy(map.destinations, "name");
  const ends = route
    ? sortBy([route.start, route.end], (name) => destinations[name].position.y)
    : undefined;
  return (
    <Stack
      css={{
        alignItems: "center",
        textAlign: "center",
        fontSize: 12,
        margin: 4,
        cursor: clickable || route ? "pointer" : undefined,
      }}
      onClick={
        onClick
          ? onClick
          : () => {
              if (!clickable) {
                if (highlighted) {
                  setHighlighted(false);
                  onUnhighlight?.(route);
                } else {
                  setHighlighted(true);
                  onHighlight?.(route);
                }
              }
            }
      }
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
          fontSize: 16,
          color: "white",
          fontWeight: "bold",
          position: "relative",
        }}
      >
        {route ? (
          <>
            <CityHint
              city={destinations[route.start]}
              map={map}
              highlighted={highlighted}
            ></CityHint>
            <CityHint
              city={destinations[route.end]}
              map={map}
              highlighted={highlighted}
            ></CityHint>
          </>
        ) : null}
        <div css={{ margin: "auto", zIndex: 1 }}>{count}</div>
      </Flex>
      <Flex>{ends ? ends[0] : "Routes"}</Flex>
    </Stack>
  );
};
