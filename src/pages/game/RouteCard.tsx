import { Flex } from "atoms/Flex";
import { Stack } from "atoms/Stack";
import { Destination, Route } from "data/Game";
import React from "react";
import { sortBy } from "util/sort-by";

interface Props {
  count?: number;
  route?: Route;
  clickable?: boolean;
  destinations: { [name: string]: Destination };
  onClick?: () => void;
}

export const RouteCard = ({
  count,
  route,
  clickable,
  onClick,
  destinations,
}: Props) => {
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
                left: `${(destinations[route.start].position.x / 16) * 80}%`,
                top: `${(destinations[route.start].position.y / 9) * 80}%`,
              }}
            ></div>
            <div
              css={{
                background: "orange",
                width: 6,
                height: 6,
                borderRadius: 3,
                position: "absolute",
                left: `${(destinations[route.end].position.x / 16) * 80}%`,
                top: `${(destinations[route.end].position.y / 9) * 80}%`,
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
