import { FirestoreDataConverter, Timestamp } from "@firebase/firestore";

export interface Position {
  x: number;
  y: number;
}

export interface Destination {
  name: string;
  position: Position;
}

export type TrainColor =
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "blue"
  | "rainbow";

export const trainColors = {
  red: "red",
  orange: "orange",
  yellow: "yellow",
  green: "green",
  blue: "blue",
  rainbow: "grey",
};

export interface Line {
  start: Destination["name"];
  end: Destination["name"];
  color: TrainColor[];
  length: number;
  isFerry: boolean;
  isTunnel: boolean;
  owners: { [key: string]: string };
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

export interface Player {
  name: string;
  order: number;
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

export interface Game {
  id: string;
  created: Timestamp;
  isStarted: boolean;
  map: Map["id"];
  mapCode?: string;
  turn: number;
}
// todo
export const GameConverter: FirestoreDataConverter<Game> = {
  toFirestore: (game) => game,
  fromFirestore: (gameRef) => gameRef.data() as Game,
};
