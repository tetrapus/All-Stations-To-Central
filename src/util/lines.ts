import { Game, GameMap, Player } from "data/Game";
import { UndirectedGraph } from "graphology";

export const getMapGraph = (map: GameMap) => {
  const graph = new UndirectedGraph();
  map.destinations.forEach((destination) => graph.addNode(destination.name));
  return graph;
};

export const getOwnedLines = (player: Player, game: Game) => {
  const map = game.map;
  if (!map) {
    return [];
  }
  return Object.entries(game.boardState.lines)
    .map(([lineno, owners]) =>
      Object.values(owners).includes(player.order) ? [lineno] : []
    )
    .flat(1)
    .map((lineno) => map.lines[Number(lineno)]);
};
