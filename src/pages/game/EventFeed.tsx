import { Stack } from "atoms/Stack";
import React from "react";
import TimeAgo from "react-timeago";
import { EngineContext, useEngine } from "util/game-engine";

export function EventFeed({ id }: { id: string }) {
  const engine = useEngine(EngineContext);

  const [events] = engine.getEvents();

  return (
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
            date={event.timestamp?.toDate()}
            css={{ color: "grey", fontSize: 10 }}
          />
          <div css={{ fontSize: 12 }}>{event.message}</div>
        </div>
      ))}
    </Stack>
  );
}
