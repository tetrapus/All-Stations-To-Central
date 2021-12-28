import React, { ReactNode, useContext } from "react";
import {
  EngineContext,
  PlayerEngine,
  PlayerEngineContext,
} from "util/game-engine";

interface Props {
  children: ReactNode;
}

export function PlayerView({ children }: Props) {
  const engine = useContext(EngineContext);

  if (!(engine instanceof PlayerEngine)) {
    return null;
  }
  return (
    <PlayerEngineContext.Provider value={engine}>
      {children}
    </PlayerEngineContext.Provider>
  );
}
