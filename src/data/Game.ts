import { FirestoreDataConverter, Timestamp } from "@firebase/firestore";

export interface Position {
  x: number;
  y: number;
}

export interface Destination {
  name: string;
  position: Position;
}

export type TrainColor = string;

export const trainColors: { [key: TrainColor]: string } = {
  red: "red",
  orange: "orange",
  yellow: "yellow",
  green: "green",
  blue: "blue",
  white: "white",
  black: "#333",
  pink: "pink",
  rainbow:
    "linear-gradient(122deg, rgba(57,0,129,1) 0%, rgba(66,48,173,1) 8%, rgba(44,117,190,1) 19%, rgba(42,197,144,1) 36%, rgba(144,253,29,1) 51%, rgba(250,253,45,1) 68%, rgba(255,160,54,1) 83%, rgba(207,49,49,1) 100%)",
};

export interface Line {
  start: Destination["name"];
  end: Destination["name"];
  color: TrainColor[];
  length: number;
  isFerry: boolean;
  isTunnel: boolean;
}

export interface Route {
  start: Destination["name"];
  end: Destination["name"];
  points: number;
  isBig?: boolean; // TODO: Later feature
}

export interface Card {
  color: TrainColor;
}

export interface Bonus {
  name: string;
  points: number;
  criteria: (a: any, b: any) => number; // todo
}

export interface Map {
  id: "sydney" | "nordic" | "europe" | "america" | "generated";
  name: string;
  background: string;
  destinations: Destination[];
  lines: Line[];
  routes: Route[];
  deck: { [key: string]: number };
  bonuses: Bonus[];
  scoringTable: { [key: number]: number };
  players: { min: number; max: number };
  canMonopolizeLineMin: number;
}

type PlayerColor = string;

export const playerColors: { [color: PlayerColor]: string } = {
  white: "white",
  black: "black",
  purple: "purple",
  grey: "grey",
};
export interface Player {
  name: string;
  order: number;
  color: PlayerColor;
  hand: Card[];
  routes: Route[];
  trainCount: number;
  stationCount: number; // TODO: later feature
}

// todo
export const PlayerConverter: FirestoreDataConverter<Player> = {
  toFirestore: (player) => player,
  fromFirestore: (playerRef) => playerRef.data() as Player,
};

export interface BoardState {
  carriages: {
    deck: Card[];
    faceUp: Card[];
    discard: Card[];
  };
  routes: {
    deck: Card[];
    discard: Card[];
  };
  lines: {
    [lineno: number]: {
      [trackno: number]: string;
    };
  };
}

export interface GameEvent {
  timestamp: Timestamp;
  author: string;
  type: "drew-carriages" | "drew-routes" | "played-train";
}

export interface Game {
  id: string;
  created: Timestamp;
  isStarted: boolean;
  map?: Map;
  turn: number;
  turnState?: "choose" | "drawn" | "routes-taken" | "ferry-attempted";
  boardState: BoardState;
}
// todo
export const GameConverter: FirestoreDataConverter<Game> = {
  toFirestore: (game) => game,
  fromFirestore: (gameRef) => gameRef.data() as Game,
};
