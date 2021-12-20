import { Game } from "data/Game";
import { deleteField, FieldValue, serverTimestamp } from "firebase/firestore";

export function getNextTurn(
  game: Game,
  isSkip?: boolean
): Partial<Omit<Game, "turnStart"> & { turnStart: FieldValue }> {
  if (game.removedPlayers.length === game.playerCount) {
    throw Error("No players left!");
  }
  let turn = game.turn;
  do {
    turn = turn + 1;
  } while (game.removedPlayers.includes(turn % game.playerCount));
  return {
    turn,
    turnState: "choose",
    turnStart:
      turn >= game.playerCount &&
      (!game.lastMove || game.lastMove > turn - game.playerCount)
        ? serverTimestamp()
        : deleteField(),
    lastMove: isSkip ? game.lastMove : game.turn,
  };
}
