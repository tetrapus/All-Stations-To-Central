import { FirestoreDataConverter, Timestamp } from "@firebase/firestore";

export interface GameEvent {
  timestamp: Timestamp;
  author: string;
  type?: "drew-carriages" | "drew-routes" | "played-train";
  message: string;
}

export const GameEventConverter: FirestoreDataConverter<GameEvent> = {
  toFirestore: (gameEvent) => gameEvent,
  fromFirestore: (gameEventRef) => gameEventRef.data() as GameEvent,
};
