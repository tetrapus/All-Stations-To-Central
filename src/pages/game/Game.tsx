import React from "react";
import { WaitingRoom } from "./WaitingRoom";
import { useParams } from "react-router-dom";
import { useDocument } from "react-firebase-hooks/firestore";
import { doc, DocumentReference, Timestamp } from "@firebase/firestore";
import { db } from "init/firebase";

interface Position {
  x: number;
  y: number;
}

interface Destination {
  name: string;
  position: Position;
}

type TrainColor = "red" | "orange" | "yellow" | "green" | "blue" | "rainbow";

interface Line {
  start: Destination["name"];
  end: Destination["name"];
  color: TrainColor[];
  length: number;
  isFerry: boolean;
  isTunnel: boolean;
  owners: { [key: string]: string };
}

interface Route {
  start: Destination["name"];
  end: Destination["name"];
  points: number;
  isBig?: boolean; // TODO: Later feature
}

interface Card {
  color: TrainColor;
}

interface Bonus {
  name: string;
  points: number;
  criteria: (a: any, b: any) => number; // todo
}

interface Map {
  id: "sydney" | "nordic" | "europe" | "america";
  name: string;
  background: string;
  destinations: Destination[];
  lines: Line[];
  routes: Route[];
  deck: Card[];
  bonuses: Bonus[];
  scoringTable: { [key: number]: number };
  players: { min: number; max: number };
  canMonopolizeLineMin: number;
}

interface Player {
  name: string;
  order: number;
  hand: Card[];
  routes: Route[];
  trainCount: number;
  stationCount: number; // TODO: later feature
}

interface Game {
  id: string;
  created: Timestamp;
  players: Player[];
  isStarted: boolean;
  map: Map["id"];
  turn: number;
}

export function Game() {
  const { id } = useParams<{ id: string }>();

  const [game, gameLoading, gameError] = useDocument(doc(db, "games", id));

  return <WaitingRoom />;
}
