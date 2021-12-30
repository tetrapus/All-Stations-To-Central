import { FirestoreDataConverter, Timestamp } from "@firebase/firestore";

export interface Position {
  x: number;
  y: number;
}

export interface Destination {
  id: number;
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
  white: "#eee",
  black: "#666",
  pink: "#ff8eb6",
  rainbow:
    "linear-gradient(122deg, rgba(57,0,129,1) 0%, rgba(66,48,173,1) 8%, rgba(44,117,190,1) 19%, rgba(42,197,144,1) 36%, rgba(144,253,29,1) 51%, rgba(250,253,45,1) 68%, rgba(255,160,54,1) 83%, rgba(207,49,49,1) 100%)",
};

export const tunnelColors: { [key: TrainColor]: string } = {
  ...trainColors,
  rainbow:
    "url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB2aWV3Qm94PSIwIDAgOTI2LjExNSAxMDQuODc0IiB3aWR0aD0iOTI2LjExNSIgaGVpZ2h0PSIxMDQuODc0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOmJ4PSJodHRwczovL2JveHktc3ZnLmNvbSI+CiAgPHJlY3QgeD0iLTAuMjkxIiB5PSItMC43NDEiIHdpZHRoPSI3OC4wNyIgaGVpZ2h0PSIxMDUuNzY1IiBzdHlsZT0ic3Ryb2tlOiByZ2IoMCwgMCwgMCk7IGZpbGw6IHJnYigyNTUsIDAsIDApOyBzdHJva2Utd2lkdGg6IDBweDsiLz4KICA8cmVjdCB4PSIxMzUuMTM5IiB5PSIwLjA2NCIgd2lkdGg9Ijc4LjA3IiBoZWlnaHQ9IjEwNS43NjUiIHN0eWxlPSJzdHJva2Utd2lkdGg6IDBweDsgc3Ryb2tlOiByZ2IoMjU1LCAxNTcsIDApOyBmaWxsOiByZ2IoMjU1LCAxMDIsIDApOyIvPgogIDxyZWN0IHg9IjI3My4yODgiIHk9Ii0wLjIiIHdpZHRoPSI3OC4wNyIgaGVpZ2h0PSIxMDUuNzY1IiBzdHlsZT0ic3Ryb2tlLXdpZHRoOiAwcHg7IHN0cm9rZTogcmdiKDI1NSwgMTU3LCAwKTsgZmlsbDogcmdiKDI1NSwgMjUxLCAwKTsiIGJ4Om9yaWdpbj0iMi41NTggMC4yMTciLz4KICA8cmVjdCB4PSI0MTAuNTU5IiB5PSItMC44NTgiIHdpZHRoPSI3OC4wNyIgaGVpZ2h0PSIxMDUuNzY1IiBzdHlsZT0ic3Ryb2tlLXdpZHRoOiAwcHg7IHN0cm9rZTogcmdiKDI1NSwgMTU3LCAwKTsgZmlsbDogcmdiKDAsIDI1NSwgNTEpOyIgYng6b3JpZ2luPSIyLjU1OCAwLjIxNyIvPgogIDxyZWN0IHg9IjU1Ny42MDMiIHk9Ii0wLjg3MyIgd2lkdGg9Ijc4LjA3IiBoZWlnaHQ9IjEwNS43NjUiIHN0eWxlPSJzdHJva2Utd2lkdGg6IDBweDsgc3Ryb2tlOiByZ2IoMjU1LCAxNTcsIDApOyBmaWxsOiByZ2IoMCwgMTM2LCAyNTUpOyIgYng6b3JpZ2luPSIyLjU1OCAwLjIxNyIvPgogIDxyZWN0IHg9IjcxMS4xODYiIHk9Ii0wLjc3NCIgd2lkdGg9Ijc4LjA3IiBoZWlnaHQ9IjEwNS43NjUiIHN0eWxlPSJzdHJva2Utd2lkdGg6IDBweDsgc3Ryb2tlOiByZ2IoMjU1LCAxNTcsIDApOyBmaWxsOiByZ2IoOTMsIDAsIDI1NSk7IiBieDpvcmlnaW49IjIuNTU4IDAuMjE3Ii8+CiAgPHJlY3QgeD0iODQ3LjgwNSIgeT0iLTAuNDYzIiB3aWR0aD0iNzguMDciIGhlaWdodD0iMTA1Ljc2NSIgc3R5bGU9InN0cm9rZS13aWR0aDogMHB4OyBzdHJva2U6IHJnYigyNTUsIDE1NywgMCk7IGZpbGw6IHJnYigyMjEsIDAsIDI1NSk7IiBieDpvcmlnaW49IjIuNTU4IDAuMjE3Ii8+Cjwvc3ZnPg==)",
};

export const trainPatterns = (
  opacity?: number
): { [key: TrainColor]: string } => ({
  red: `url("data:image/svg+xml,%3Csvg width='42' height='44' viewBox='0 0 42 44' xmlns='http://www.w3.org/2000/svg'%3E%3Cg id='Page-1' fill='none' fill-rule='evenodd'%3E%3Cg id='brick-wall' fill='%23ffffff' fill-opacity='${
    opacity || 1
  }'%3E%3Cpath d='M0 0h42v44H0V0zm1 1h40v20H1V1zM0 23h20v20H0V23zm22 0h20v20H22V23z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");`,
  orange: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='${
    opacity || 1
  }' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E");`,
  yellow: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg id='hexagons' fill='%23ffffff' fill-opacity='${
    opacity || 1
  }' fill-rule='nonzero'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5L12.98 41v8h-2v-6.85L0 35.81v-2.3zM15 0v7.5L27.99 15H28v-2.31h-.01L17 6.35V0h-2zm0 49v-8l12.99-7.5H28v2.31h-.01L17 42.15V49h-2z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");`,
  green: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 40' width='80' height='40'%3E%3Cpath fill='%23ffffff' fill-opacity='${
    opacity || 1
  }' d='M0 40a19.96 19.96 0 0 1 5.9-14.11 20.17 20.17 0 0 1 19.44-5.2A20 20 0 0 1 20.2 40H0zM65.32.75A20.02 20.02 0 0 1 40.8 25.26 20.02 20.02 0 0 1 65.32.76zM.07 0h20.1l-.08.07A20.02 20.02 0 0 1 .75 5.25 20.08 20.08 0 0 1 .07 0zm1.94 40h2.53l4.26-4.24v-9.78A17.96 17.96 0 0 0 2 40zm5.38 0h9.8a17.98 17.98 0 0 0 6.67-16.42L7.4 40zm3.43-15.42v9.17l11.62-11.59c-3.97-.5-8.08.3-11.62 2.42zm32.86-.78A18 18 0 0 0 63.85 3.63L43.68 23.8zm7.2-19.17v9.15L62.43 2.22c-3.96-.5-8.05.3-11.57 2.4zm-3.49 2.72c-4.1 4.1-5.81 9.69-5.13 15.03l6.61-6.6V6.02c-.51.41-1 .85-1.48 1.33zM17.18 0H7.42L3.64 3.78A18 18 0 0 0 17.18 0zM2.08 0c-.01.8.04 1.58.14 2.37L4.59 0H2.07z'%3E%3C/path%3E%3C/svg%3E");`,
  blue: `url("data:image/svg+xml,%3Csvg width='100' height='20' viewBox='0 0 100 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M21.184 20c.357-.13.72-.264 1.088-.402l1.768-.661C33.64 15.347 39.647 14 50 14c10.271 0 15.362 1.222 24.629 4.928.955.383 1.869.74 2.75 1.072h6.225c-2.51-.73-5.139-1.691-8.233-2.928C65.888 13.278 60.562 12 50 12c-10.626 0-16.855 1.397-26.66 5.063l-1.767.662c-2.475.923-4.66 1.674-6.724 2.275h6.335zm0-20C13.258 2.892 8.077 4 0 4V2c5.744 0 9.951-.574 14.85-2h6.334zM77.38 0C85.239 2.966 90.502 4 100 4V2c-6.842 0-11.386-.542-16.396-2h-6.225zM0 14c8.44 0 13.718-1.21 22.272-4.402l1.768-.661C33.64 5.347 39.647 4 50 4c10.271 0 15.362 1.222 24.629 4.928C84.112 12.722 89.438 14 100 14v-2c-10.271 0-15.362-1.222-24.629-4.928C65.888 3.278 60.562 2 50 2 39.374 2 33.145 3.397 23.34 7.063l-1.767.662C13.223 10.84 8.163 12 0 12v2z' fill='%23ffffff' fill-opacity='${
    opacity || 1
  }' fill-rule='evenodd'/%3E%3C/svg%3E");`,
  white: ` url("data:image/svg+xml,%3Csvg width='52' height='26' viewBox='0 0 52 26' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='${
    opacity || 1
  }'%3E%3Cpath d='M10 10c0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6h2c0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4v2c-3.314 0-6-2.686-6-6 0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6zm25.464-1.95l8.486 8.486-1.414 1.414-8.486-8.486 1.414-1.414z' /%3E%3C/g%3E%3C/g%3E%3C/svg%3E");`,
  black: `url("data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='${
    opacity || 1
  }' fill-rule='evenodd'%3E%3Cpath d='M5 0h1L0 6V5zM6 5v1H5z'/%3E%3C/g%3E%3C/svg%3E");`,
  pink: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='72' viewBox='0 0 36 72'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='${
    opacity || 1
  }'%3E%3Cpath d='M2 6h12L8 18 2 6zm18 36h12l-6 12-6-12z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");`,
  rainbow: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 56 28' width='56' height='28'%3E%3Cpath fill='%23ffffff' fill-opacity='${
    opacity || 1
  }' d='M56 26v2h-7.75c2.3-1.27 4.94-2 7.75-2zm-26 2a2 2 0 1 0-4 0h-4.09A25.98 25.98 0 0 0 0 16v-2c.67 0 1.34.02 2 .07V14a2 2 0 0 0-2-2v-2a4 4 0 0 1 3.98 3.6 28.09 28.09 0 0 1 2.8-3.86A8 8 0 0 0 0 6V4a9.99 9.99 0 0 1 8.17 4.23c.94-.95 1.96-1.83 3.03-2.63A13.98 13.98 0 0 0 0 0h7.75c2 1.1 3.73 2.63 5.1 4.45 1.12-.72 2.3-1.37 3.53-1.93A20.1 20.1 0 0 0 14.28 0h2.7c.45.56.88 1.14 1.29 1.74 1.3-.48 2.63-.87 4-1.15-.11-.2-.23-.4-.36-.59H26v.07a28.4 28.4 0 0 1 4 0V0h4.09l-.37.59c1.38.28 2.72.67 4.01 1.15.4-.6.84-1.18 1.3-1.74h2.69a20.1 20.1 0 0 0-2.1 2.52c1.23.56 2.41 1.2 3.54 1.93A16.08 16.08 0 0 1 48.25 0H56c-4.58 0-8.65 2.2-11.2 5.6 1.07.8 2.09 1.68 3.03 2.63A9.99 9.99 0 0 1 56 4v2a8 8 0 0 0-6.77 3.74c1.03 1.2 1.97 2.5 2.79 3.86A4 4 0 0 1 56 10v2a2 2 0 0 0-2 2.07 28.4 28.4 0 0 1 2-.07v2c-9.2 0-17.3 4.78-21.91 12H30zM7.75 28H0v-2c2.81 0 5.46.73 7.75 2zM56 20v2c-5.6 0-10.65 2.3-14.28 6h-2.7c4.04-4.89 10.15-8 16.98-8zm-39.03 8h-2.69C10.65 24.3 5.6 22 0 22v-2c6.83 0 12.94 3.11 16.97 8zm15.01-.4a28.09 28.09 0 0 1 2.8-3.86 8 8 0 0 0-13.55 0c1.03 1.2 1.97 2.5 2.79 3.86a4 4 0 0 1 7.96 0zm14.29-11.86c1.3-.48 2.63-.87 4-1.15a25.99 25.99 0 0 0-44.55 0c1.38.28 2.72.67 4.01 1.15a21.98 21.98 0 0 1 36.54 0zm-5.43 2.71c1.13-.72 2.3-1.37 3.54-1.93a19.98 19.98 0 0 0-32.76 0c1.23.56 2.41 1.2 3.54 1.93a15.98 15.98 0 0 1 25.68 0zm-4.67 3.78c.94-.95 1.96-1.83 3.03-2.63a13.98 13.98 0 0 0-22.4 0c1.07.8 2.09 1.68 3.03 2.63a9.99 9.99 0 0 1 16.34 0z'%3E%3C/path%3E%3C/svg%3E");`,
});

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

type BonusType = "globetrotter" | "cross-country";

export interface Bonus {
  type: BonusType;
  name: string;
  points: number;
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
    [lineNo: number]: {
      [trackNo: number]: number;
    };
  };
  stations: {
    owners: {
      [destinationNo: number]: number;
    };
    lines: {
      [destinationNo: number]: { [playerNo: number]: number };
    };
  };
}

export interface Game {
  id: string;
  created: Timestamp;
  isStarted: boolean;
  isReady: boolean;
  playerCount: number;
  readyCount: number;
  removedPlayers: number[];
  map: GameMap;
  turn: number;
  turnStart?: Timestamp;
  turnState?: "choose" | "drawn" | "routes-taken";
  boardState: BoardState;
  finalTurn?: number;
  moveTimer?: number;
  lastMove?: number;
  scored?: boolean;
}
// todo
export const GameConverter: FirestoreDataConverter<Game> = {
  toFirestore: (game) => game,
  fromFirestore: (gameRef) => gameRef.data() as Game,
};

export const DEFAULT_MAP_SETTINGS = {
  cities: 50,
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
    height: 900,
    width: 1600,
  },
};
