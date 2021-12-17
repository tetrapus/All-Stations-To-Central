import { Game } from "data/Game";
import { Player } from "data/Game";

export const isCurrentPlayer = (game: Game, player: Player) =>
  !game.isReady || (game.finalTurn && game.turn > game.finalTurn)
    ? false
    : game.turn % game.playerCount === player.order;
