import { CELL_SIZE } from "data/Board";
import {
  Destination,
  GameMap,
  Line,
  Position,
  Route,
  trainColors,
} from "data/Game";
import { UndirectedGraph } from "graphology";
import dijkstra from "graphology-shortest-path/dijkstra";
import overlap from "polygon-overlap";
import { choose, generateCity, generateRegion } from "./citygen";
import { indexBy } from "./index-by";
import { sortBy } from "./sort-by";

interface MapSettings {
  cities: number;
  connectivity: number;
  tunnels: number;
  ferries: number;
  routes: number;
  players: { min: number; max: number };
  canMonopolizeLineMin: number;
  scoringTable: { [key: number]: number };
  size: { height: number; width: number };
}

export function distance(
  { position: position1 }: Destination,
  { position: position2 }: Destination
) {
  return Math.sqrt(
    Math.pow(position1.x - position2.x, 2) +
      Math.pow(position1.y - position2.y, 2)
  );
}

function lerp(min: number, max: number, t: number): number {
  return min * (1 - t) + max * t;
}

function sublerp(A: Position, B: Position) {
  return {
    A: {
      x: lerp(A.x, B.x, 0.1),
      y: lerp(A.y, B.y, 0.1),
    },
    B: {
      x: lerp(A.x, B.x, 0.9),
      y: lerp(A.y, B.y, 0.9),
    },
  };
}

export function intersect({
  A,
  B,
  C,
  D,
}: {
  A: Position;
  B: Position;
  C: Position;
  D: Position;
}) {
  const {
    A: { x: a, y: b },
    B: { x: c, y: d },
  } = sublerp(A, B);
  const {
    A: { x: p, y: q },
    B: { x: r, y: s },
  } = sublerp(C, D);
  const e = 0.05;
  return overlap(
    [
      [a + e, b + e],
      [a - e, b - e],
      [c - e, d - e],
      [c + e, d + e],
    ],
    [
      [p + e, q + e],
      [p - e, q - e],
      [r - e, s - e],
      [r + e, s + e],
    ]
  );
}

export function generateMap(mapSettings: MapSettings): GameMap {
  const map: GameMap = {
    id: "generated",
    name: generateRegion(),
    background: "", // todo
    destinations: [],
    lines: [],
    routes: [],
    deck: {
      red: 12,
      orange: 12,
      yellow: 12,
      green: 12,
      blue: 12,
      white: 12,
      black: 12,
      pink: 12,
      rainbow: 14,
    },
    bonuses: [], // todo
    scoringTable: mapSettings.scoringTable,
    players: mapSettings.players,
    canMonopolizeLineMin: mapSettings.canMonopolizeLineMin, // todo: balance
    size: mapSettings.size,
  };

  const margins = {
    left: 0.5,
    right: 1,

    top: 0.5,
    bottom: 1,
  };
  const mapCells = {
    x: Math.floor(mapSettings.size.width / CELL_SIZE),
    y: Math.floor(mapSettings.size.height / CELL_SIZE),
  };
  const tracks = {
    x: mapCells.x - margins.left - margins.right,
    y: mapCells.y - margins.top - margins.bottom,
  };
  while (map.destinations.length < mapSettings.cities) {
    const candidate = {
      name: generateCity(),
      position: {
        x: Math.round(tracks.x * Math.random()) + margins.left,
        y: Math.round(tracks.y * Math.random()) + margins.top,
      },
    };
    if (candidate.position.x % 2 === 0) {
      candidate.position.y += 0.5;
    }
    if (
      map.destinations.some(
        (city) =>
          distance(city, candidate) <= 0.8 || city.name === candidate.name
      )
    ) {
      continue;
    }
    map.destinations.push(candidate);
  }

  let possiblePaths = [];
  for (var i = 0; i < mapSettings.cities; i++) {
    for (var j = i + 1; j < mapSettings.cities; j++) {
      possiblePaths.push({
        distance: distance(map.destinations[i], map.destinations[j]),
        start: map.destinations[i],
        end: map.destinations[j],
      });
    }
  }
  possiblePaths = sortBy(possiblePaths, (path) => path.distance);
  const possibleRoutes = [...possiblePaths];

  const destinations = indexBy(map.destinations, "name");

  // lay shortest path that does not overlap with existing path until we reach connectivity
  while (possiblePaths.length) {
    const candidate = possiblePaths.pop();
    if (!candidate) {
      throw new Error();
    }
    if (
      map.lines.some((line) => {
        const segments = {
          A: destinations[line.start].position,
          B: destinations[line.end].position,
          C: candidate.start.position,
          D: candidate.end.position,
        };
        const res = intersect(segments);
        /*
        if (res) {
          console.log(
            "Rejected",
            candidate.start,
            candidate.end,
            " conflict ",
            line.start,
            line.end
          );
        } */
        return res;
      })
    ) {
      continue;
    }
    const length = Math.round(candidate.distance * 1.2);
    if (!mapSettings.scoringTable[length]) {
      continue;
    }
    map.lines.push({
      start: candidate.start.name,
      end: candidate.end.name,
      length: length,
      color: [
        choose(Object.fromEntries(Object.keys(trainColors).map((e) => [e, 1]))),
      ],
      isTunnel: false, // todo
      ferries: 0, // todo
    });
  }
  const lineCount = Object.fromEntries(
    map.destinations.map((city) => [city.name, 0])
  );
  map.lines.forEach((line) => {
    lineCount[line.start] += 1;
  });

  while (map.lines.length * 2 > mapSettings.connectivity * mapSettings.cities) {
    const sortedCities = sortBy(
      map.destinations,
      (city) => -lineCount[city.name]
    );
    const overconnected = sortedCities.pop();
    if (!overconnected) {
      break;
    }
    const candidates = map.lines
      .map((line, idx) => ({ line, idx }))
      .filter(
        ({ line }) =>
          line.start === overconnected.name || line.end === overconnected.name
      );
    const selectedLine = sortBy(
      candidates,
      (candidate) =>
        -lineCount[
          candidate.line.start === overconnected.name
            ? candidate.line.end
            : candidate.line.start
        ]
    ).pop();
    if (!selectedLine) {
      break;
    }
    map.lines.splice(selectedLine.idx, 1);
    lineCount[selectedLine.line.start] -= 1;
    lineCount[selectedLine.line.end] -= 1;
  }

  // Any destinations missing a line? Get rid of them.
  map.destinations = map.destinations.filter((city) =>
    map.lines.find((line) => line.start === city.name || line.end === city.name)
  );

  // Same for the scorecard!
  map.scoringTable = Object.fromEntries(
    Object.entries(map.scoringTable).filter(([length]) =>
      map.lines.some((line) => line.length === Number(length))
    )
  );

  // Make some ferries and tunnels!
  const water = {
    A: { x: Math.random() * mapCells.x, y: Math.random() * mapCells.y },
    B: { x: Math.random() * mapCells.x, y: Math.random() * mapCells.y },
  };
  map.lines
    .filter((line) =>
      intersect({
        ...water,
        C: destinations[line.start].position,
        D: destinations[line.end].position,
      })
    )
    .forEach((line) => {
      line.ferries += 1;
    });

  let mountains: { A: { x: number; y: number }; B: { x: number; y: number } };
  do {
    mountains = {
      A: { x: Math.random() * mapCells.x, y: Math.random() * mapCells.y },
      B: { x: Math.random() * mapCells.x, y: Math.random() * mapCells.y },
    };
  } while (
    intersect({
      ...mountains,
      C: water.A,
      D: water.B,
    })
  );
  map.lines
    .filter((line) =>
      intersect({
        ...mountains,
        C: destinations[line.start].position,
        D: destinations[line.end].position,
      })
    )
    .forEach((line) => {
      line.isTunnel = true;
    });

  // Build a graph
  const graph = new UndirectedGraph();
  map.destinations.forEach((destination) => graph.addNode(destination.name));
  console.log(graph.nodes(), map.destinations, map.lines);
  map.lines.forEach((line) =>
    graph.addEdge(line.start, line.end, {
      weight: line.length + line.ferries + (line.isTunnel ? 1 : 0),
    })
  );

  const getPathLength = (graph: UndirectedGraph, route: Route) => {
    const path = dijkstra.bidirectional(graph, route.start, route.end) || [];

    const length = path
      .slice(1)
      .map((_, idx) =>
        graph.getEdgeAttribute(path[idx], path[idx + 1], "weight")
      )
      .reduce((a, b) => a + b, 0);
    return length;
  };

  // Generate routes
  while (map.routes.length < mapSettings.routes && possibleRoutes.length) {
    // Pick a random route
    const candidateRoute = possibleRoutes.splice(
      Math.floor(possibleRoutes.length * Math.random()),
      1
    )[0];
    // Discard if adjacent route or nonexistant destination
    if (
      map.lines.find(
        (line) =>
          new Set([
            line.start,
            line.end,
            candidateRoute.start.name,
            candidateRoute.end.name,
          ]).size <= 2
      )
    ) {
      continue;
    }

    // Compute shortest path
    try {
      const length = getPathLength(graph, {
        start: candidateRoute.start.name,
        end: candidateRoute.end.name,
        points: 0,
      });
      if (length >= 30) {
        // Get rid of any megaroutes
        continue;
      }
      map.routes.push({
        start: candidateRoute.start.name,
        end: candidateRoute.end.name,
        points: Math.round(
          length / 2 +
            (Math.random() - 0.25) * length * 0.25 +
            2 * Math.log(length)
        ), // todo
      });
    } catch (Error) {
      continue;
    }
  }

  const lineImportance = map.lines.map((line) => {
    // Test what happens if we remove the edge from the graph...
    const oldScores = map.routes.map((route) => getPathLength(graph, route));
    graph.dropEdge(line.start, line.end);
    const newScores = map.routes.map((route) => {
      const length = getPathLength(graph, route);
      if (!length) {
        // If the route is completely severed, use the points as the delta score.
        return route.points * 3;
      } else {
        return length;
      }
    });
    graph.addEdge(line.start, line.end, {
      weight: line.length + line.ferries + (line.isTunnel ? 1 : 0),
    });
    return (
      newScores.reduce((a, b) => a + b, 0) -
      oldScores.reduce((a, b) => a + b, 0)
    );
  });

  const criticalLines = sortBy(
    map.lines.map((line, idx) => [line, idx] as [Line, number]),
    ([line, idx]) => -lineImportance[idx]
  );
  let lineSum = map.lines
    .map((line) => line.length * line.color.length)
    .reduce((a, b) => a + b, 0);
  while (criticalLines.length && lineSum < 45 * mapSettings.players.max) {
    const [line, idx] = criticalLines.pop() as [Line, number];
    lineSum += line.length;
    map.lines[idx].color.push(
      choose(Object.fromEntries(Object.keys(trainColors).map((e) => [e, 1])))
    );
  }

  return map;
}
