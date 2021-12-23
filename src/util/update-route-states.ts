import { Game, Player } from "data/Game";
import { dijkstra } from "graphology-shortest-path";
import { getMapGraph, getOwnedLines } from "./lines";

export function updateRouteStates(game: Game, me: Player) {
  const graph = getMapGraph(game.map);
  const ownedLines = getOwnedLines(me, game);

  ownedLines.forEach((line) => graph.addEdge(line.start, line.end));
  console.log(
    Object.entries(game.boardState.stations.lines).flatMap(
      ([destNo, owners]) => [destNo, ...Object.entries(owners)]
    )
  );
  Object.entries(game.boardState.stations.lines)
    .map(([destNo, owners]) => [destNo, owners[me.order]])
    .filter(([cityNo, destNo]) => destNo !== undefined)
    .map(([cityNo, destNo]) => [
      game.map.destinations[Number(cityNo)].name,
      game.map.destinations[Number(destNo)].name,
    ])
    .filter(
      ([city, dest]) =>
        game.map.lines
          .filter((line, lineNo) => game.boardState.lines[lineNo])
          .filter(
            (line) =>
              (line.start === city && line.end === dest) ||
              (line.end === city && line.start === dest)
          ).length
    )
    .forEach(([city, dest]) => {
      try {
        graph.addEdge(city, dest);
      } catch {
        return;
      }
    });

  return {
    routes: me.routes.map((route) => ({
      ...route,
      won: !!dijkstra.bidirectional(graph, route.start, route.end),
    })),
    graph,
    ownedLines,
  };
}
