import { DEFAULT_MAP_SETTINGS, Game, Player } from "data/Game";
import { GameEventConverter } from "data/GameEvent";
import { orderBy, query, serverTimestamp } from "firebase/firestore";
import { collectionRef, db, docRef, NewRecord } from "init/firebase";
import React, { Context, useContext } from "react";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { nOf } from "util/n-of";
import { generateColor } from "./colorgen";
import { generateMap } from "./mapgen";
import { runTransaction } from "./run-game-action";

const randomElement = (array: any[]) =>
  array[Math.floor(Math.random() * array.length)];

function generateCode() {
  return `${nOf(3, () => randomElement([..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"])).join(
    ""
  )}-${nOf(3, () => randomElement([..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"])).join(
    ""
  )}`;
}

type Move = {
  SelectStation: {
    destination: number;
  };
};

export class GameEngine {
  constructor(public game: Game, protected players: Player[]) {}

  public static async createGame(username: string): Promise<string> {
    const code = generateCode();
    await runTransaction(db, async (transaction) => {
      const game: NewRecord<Game> = {
        id: code,
        created: serverTimestamp(),
        isStarted: false,
        isReady: false,
        turn: 0,
        playerCount: 1,
        readyCount: 0,
        removedPlayers: [],
        moveTimer: 120,
        boardState: {
          carriages: {
            deck: [],
            faceUp: [],
            discard: [],
          },
          routes: {
            deck: [],
            discard: [],
          },
          lines: {},
          stations: {
            owners: {},
            lines: {},
          },
        },
        map: generateMap(DEFAULT_MAP_SETTINGS),
      };
      await transaction.set(docRef("games", code), game);
      const player: Player = {
        name: username,
        order: 0,
        color: generateColor(),
        hand: [],
        routes: [],
        trainCount: 45,
        stationCount: 3,
        isReady: false,
      };
      await transaction.set(
        docRef("games", code, "players", player.name),
        player
      );
    });
    return code;
  }

  getEvents() {
    return useCollectionData(
      query(
        collectionRef("games", this.game.id, "events").withConverter(
          GameEventConverter
        ),
        orderBy("timestamp", "desc")
      )
    );
  }

  getState(): { game: Game; players: Player[]; me?: Player } {
    return { game: this.game, players: this.players };
  }

  isEnded(): boolean {
    return !!(this.game.finalTurn && this.game.finalTurn < this.game.turn);
  }

  isActive(): boolean {
    return this.game.isReady && !this.isEnded();
  }

  isStarted(): boolean {
    return this.game.isStarted;
  }

  canAct<T extends keyof Move>(
    move: T,
    moveOptions: Move[T],
    now: boolean = true
  ): boolean {
    return false;
  }

  isCurrentPlayer() {
    return false;
  }
}

export class PlayerEngine extends GameEngine {
  constructor(
    public game: Game,
    protected players: Player[],
    public me: Player
  ) {
    super(game, players);
  }

  getState(): { game: Game; players: Player[]; me: Player } {
    return { ...super.getState(), me: this.me };
  }

  canAct<T extends keyof Move>(
    move: T,
    moveOptions: Move[T],
    now: boolean = true
  ): boolean {
    if (!this.isActive()) {
      return false;
    }
    switch (move) {
      case "SelectStation":
        const stationOwner =
          this.game.boardState.stations.owners[moveOptions.destination];
        return !!(
          stationOwner === this.me.order ||
          (stationOwner === undefined && this.me.stationCount)
        );
      default:
        throw new Error("Oh no,, my state,, it's broken");
    }
  }

  isCurrentPlayer() {
    return (
      this.isActive() &&
      this.game.turn % this.game.playerCount === this.me.order
    );
  }
}

export const EngineContext = React.createContext<GameEngine | undefined>(
  undefined
);

export const PlayerEngineContext = React.createContext<
  PlayerEngine | undefined
>(undefined);

export function useEngine<T>(context: Context<T | undefined>) {
  const engine = useContext<T | undefined>(context);
  if (!engine) {
    throw new Error("No engine!");
  }
  return engine;
}
