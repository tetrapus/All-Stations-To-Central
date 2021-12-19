import { Game } from "data/Game";
import { serverTimestamp } from "firebase/firestore";

export function getNextTurn(game: Game, isSkip?: boolean) {
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
        : undefined,
    lastMove: isSkip ? game.lastMove : game.turn,
  };
}
