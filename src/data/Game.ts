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
  red: "#f84438",
  orange: "#ffa32d",
  yellow: "#ffeb3b",
  green: "#72cc72",
  blue: "#29b2fe",
  white: "white",
  black: "#75787d",
  pink: "#ff8eb6",
  rainbow:
    "linear-gradient(122deg, rgba(57,0,129,1) 0%, rgba(66,48,173,1) 8%, rgba(44,117,190,1) 19%, rgba(42,197,144,1) 36%, rgba(144,253,29,1) 51%, rgba(250,253,45,1) 68%, rgba(255,160,54,1) 83%, rgba(207,49,49,1) 100%)",
};

export const tunnelColors: { [key: TrainColor]: string } = {
  ...trainColors,
  rainbow:
    "url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB2aWV3Qm94PSIwIDAgOTI2LjExNSAxMDQuODc0IiB3aWR0aD0iOTI2LjExNSIgaGVpZ2h0PSIxMDQuODc0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOmJ4PSJodHRwczovL2JveHktc3ZnLmNvbSI+CiAgPHJlY3QgeD0iLTAuMjkxIiB5PSItMC43NDEiIHdpZHRoPSI3OC4wNyIgaGVpZ2h0PSIxMDUuNzY1IiBzdHlsZT0ic3Ryb2tlOiByZ2IoMCwgMCwgMCk7IGZpbGw6IHJnYigyNTUsIDAsIDApOyBzdHJva2Utd2lkdGg6IDBweDsiLz4KICA8cmVjdCB4PSIxMzUuMTM5IiB5PSIwLjA2NCIgd2lkdGg9Ijc4LjA3IiBoZWlnaHQ9IjEwNS43NjUiIHN0eWxlPSJzdHJva2Utd2lkdGg6IDBweDsgc3Ryb2tlOiByZ2IoMjU1LCAxNTcsIDApOyBmaWxsOiByZ2IoMjU1LCAxMDIsIDApOyIvPgogIDxyZWN0IHg9IjI3My4yODgiIHk9Ii0wLjIiIHdpZHRoPSI3OC4wNyIgaGVpZ2h0PSIxMDUuNzY1IiBzdHlsZT0ic3Ryb2tlLXdpZHRoOiAwcHg7IHN0cm9rZTogcmdiKDI1NSwgMTU3LCAwKTsgZmlsbDogcmdiKDI1NSwgMjUxLCAwKTsiIGJ4Om9yaWdpbj0iMi41NTggMC4yMTciLz4KICA8cmVjdCB4PSI0MTAuNTU5IiB5PSItMC44NTgiIHdpZHRoPSI3OC4wNyIgaGVpZ2h0PSIxMDUuNzY1IiBzdHlsZT0ic3Ryb2tlLXdpZHRoOiAwcHg7IHN0cm9rZTogcmdiKDI1NSwgMTU3LCAwKTsgZmlsbDogcmdiKDAsIDI1NSwgNTEpOyIgYng6b3JpZ2luPSIyLjU1OCAwLjIxNyIvPgogIDxyZWN0IHg9IjU1Ny42MDMiIHk9Ii0wLjg3MyIgd2lkdGg9Ijc4LjA3IiBoZWlnaHQ9IjEwNS43NjUiIHN0eWxlPSJzdHJva2Utd2lkdGg6IDBweDsgc3Ryb2tlOiByZ2IoMjU1LCAxNTcsIDApOyBmaWxsOiByZ2IoMCwgMTM2LCAyNTUpOyIgYng6b3JpZ2luPSIyLjU1OCAwLjIxNyIvPgogIDxyZWN0IHg9IjcxMS4xODYiIHk9Ii0wLjc3NCIgd2lkdGg9Ijc4LjA3IiBoZWlnaHQ9IjEwNS43NjUiIHN0eWxlPSJzdHJva2Utd2lkdGg6IDBweDsgc3Ryb2tlOiByZ2IoMjU1LCAxNTcsIDApOyBmaWxsOiByZ2IoOTMsIDAsIDI1NSk7IiBieDpvcmlnaW49IjIuNTU4IDAuMjE3Ii8+CiAgPHJlY3QgeD0iODQ3LjgwNSIgeT0iLTAuNDYzIiB3aWR0aD0iNzguMDciIGhlaWdodD0iMTA1Ljc2NSIgc3R5bGU9InN0cm9rZS13aWR0aDogMHB4OyBzdHJva2U6IHJnYigyNTUsIDE1NywgMCk7IGZpbGw6IHJnYigyMjEsIDAsIDI1NSk7IiBieDpvcmlnaW49IjIuNTU4IDAuMjE3Ii8+Cjwvc3ZnPg==)",
};

export const ferryInsignia = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' version='1.0' viewBox='0 0 490 270'%3E%3Cpath fill='rgba(255,255,255,0.7)' d='M289.391 1.65c-25.532 0-30.106 23.94-30.106 23.94s-3.54.436-7.707 1.397c-4.167.962-6.4 5.886-9.297 6.07-4.038.256-4.312-14.112-26.3-13.825-24.292.317-23.38 19.326-26.253 18.015-3.654-1.666-19.966-.598-28.516 1.253-14.806 3.204-19.413 25.626-19.413 25.626s-5.96.972-12.861 7.226c-7.958 7.21-4.745 12.75-8.189 23.506h-8.14l.337 23.7h-35.26c-8.521 0-9.394 25.42-9.394 32.707 0 17.887 2.798 28.81 8.912 28.902l14.643.192c-10.62 19.739-.274.205-10.597 19.702l-33.96-.193v27.698s12.415-.02 21.436 0c3.263 14.297 15.638 25.377 31.021 26.397.587.038 1.105.087 1.686.096h-89.45v14.21H478.6v-14.21H368.148c.136-.005.299-.042.434-.048.07.017.123.032.193.048.072-.027.12-.07.192-.096 15.084-.912 27.78-11.742 31.118-26.397h45.087V200.06l-46.002-.193v-76.252l5.78-7.756h6.407V94.858h-96.484c-.003 9.793 0 23.363 0 23.363l-69.316.144c.013-.252.048-.516.048-.77 0-8.924-8.582-16.186-19.172-16.186s-19.171 7.262-19.171 16.185c0 .292.03.58.048.867l-55.684.097.289-23.7h-.578c1.107-1.882 4.104-5.993 9.634-7.707 5.021-1.556 10.404-1.686 10.404-1.686s3.542 3.613 17.004 3.613c13.462 0 19.22-8.14 19.22-8.14s9.052.24 15.462.24 6.306-5.41 11.754-5.347c4.586.066 7.445 12.39 32.08 12.573 15.004.11 15.631-12.137 20.906-11.995 4.588.124 9.642 7.033 24.278 7.033s20.086-12.813 20.086-12.813 4.336-5.478 4.336-15.414c0-9.937-3.372-11.513-3.372-11.513s-2.572-2.107-4.624-13.198C325.93 16.589 317.25 1.65 289.39 1.65zM135.2 227.566h21.869c3.056 13.388 14.017 23.98 28.035 26.108.375.158.766.287 1.156.385h-83.045c.157-.005.277-.04.434-.048.02.016.029.032.048.048 0-.016.09-.03.096-.048 15.21-.79 28.048-11.696 31.407-26.445zm88.295 0h21.82c3.264 14.297 15.687 25.377 31.07 26.397.12.008.217-.006.337 0 .024.028.026.07 0 .096-25.43 0-55.205.249-85.164 0 15.417-.586 28.544-11.592 31.937-26.493zm88.343 0h21.869c3.263 14.297 15.541 25.377 30.925 26.397.483.032.917.084 1.397.096-27.817-.199-65.44-.263-86.08 0 15.416-.587 28.496-11.593 31.889-26.493z'/%3E%3C/svg%3E");`;

export interface Line {
  start: Destination["name"];
  end: Destination["name"];
  color: TrainColor[];
  length: number;
  ferries: number;
  isTunnel: boolean;
}

export interface Route {
  start: Destination["name"];
  end: Destination["name"];
  points: number;
  isBig?: boolean; // TODO: Later feature
  won?: boolean;
}

export interface Card {
  color: TrainColor;
}

export interface Bonus {
  name: string;
  points: number;
  criteria: (a: any, b: any) => number; // todo
}

export interface GameMap {
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
  size: {
    height: number;
    width: number;
  };
}

type PlayerColor = string;

export interface Player {
  name: string;
  order: number;
  color: PlayerColor;
  hand: Card[];
  routes: Route[];
  routeChoices?: {
    routes: Route[];
    keepMin: number;
  };
  isReady: boolean;
  trainCount: number;
  stationCount: number; // TODO: later feature
  scores?: {
    routes: { [routeNo: number]: number };
    lines: { [carriageCount: number]: number };
    bonuses: { [bonusNo: number]: number };
    stations: number;
    total: number;
  };
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
  type?: "drew-carriages" | "drew-routes" | "played-train";
  message: string;
}

export interface Game {
  id: string;
  created: Timestamp;
  isStarted: boolean;
  isReady: boolean;
  playerCount: number;
  readyCount: number;
  map: GameMap;
  turn: number;
  turnState?: "choose" | "drawn" | "routes-taken" | "ferry-attempted";
  boardState: BoardState;
  finalTurn?: number;
  scored?: boolean;
}
// todo
export const GameConverter: FirestoreDataConverter<Game> = {
  toFirestore: (game) => game,
  fromFirestore: (gameRef) => gameRef.data() as Game,
};

export const DEFAULT_MAP_SETTINGS = {
  cities: 60,
  connectivity: 3.5,
  routes: 46,
  ferries: 0,
  tunnels: 0,
  players: { min: 2, max: 6 },
  canMonopolizeLineMin: 2,
  scoringTable: {
    1: 1,
    2: 2,
    3: 4,
    4: 7,
    5: 10,
    6: 15,
    7: 21,
    9: 27,
  },
  size: {
    height: 1200,
    width: 1200,
  },
};
