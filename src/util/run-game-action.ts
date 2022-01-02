import {
  deleteDoc,
  Firestore,
  getDoc,
  runTransaction as runTransactionWeb,
  setDoc,
  Transaction,
  updateDoc,
} from "@firebase/firestore";
import { Game, GameConverter, Player, PlayerConverter } from "data/Game";
import { db, docRef } from "init/firebase";

export function runTransaction<T>(
  db: Firestore,
  updateFunction: (transaction: Transaction) => Promise<T>
): Promise<T> {
  if (process.env.REACT_APP_DEV_MODE === "true") {
    const transaction: Transaction = {
      get: getDoc,
      set: (doc: any, ref: any) => {
        setDoc(doc, ref);
        return transaction;
      },
      update: (doc: any, ref: any) => {
        updateDoc(doc, ref);
        return transaction;
      },
      delete: (doc: any) => {
        deleteDoc(doc);
        return transaction;
      },
    };
    return updateFunction(transaction);
  }
  return runTransactionWeb(db, updateFunction);
}

export function runPlayerAction<T>(
  oldGame: Game,
  oldMe: Player,
  getNextState: ({
    game,
    me,
    transaction,
  }: {
    game: Game;
    me: Player;
    transaction: Transaction;
  }) => Promise<T>
) {
  return runTransaction(db, async (transaction) => {
    const game = (
      await transaction.get(
        docRef("games", oldGame.id).withConverter(GameConverter)
      )
    ).data();
    const me = (
      await transaction.get(
        docRef("games", oldGame.id, "players", oldMe.name).withConverter(
          PlayerConverter
        )
      )
    ).data();
    if (!game || !me) {
      return;
    }
    return await getNextState({ game, me, transaction });
  });
}

export function runGameAction<T>(
  oldGame: Game,
  getNextState: ({
    game,
    transaction,
  }: {
    game: Game;
    transaction: Transaction;
  }) => Promise<T>
) {
  return runTransaction(db, async (transaction) => {
    const game = (
      await transaction.get(
        docRef("games", oldGame.id).withConverter(GameConverter)
      )
    ).data();
    if (!game) {
      return;
    }
    return await getNextState({ game, transaction });
  });
}
