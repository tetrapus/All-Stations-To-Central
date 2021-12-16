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
import { choose, generateCity, generateRegion } from "./citygen";
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

export function intersect({
  A: p0,
  B: p1,
  C: p2,
  D: p3,
}: {
  A: Position;
  B: Position;
  C: Position;
  D: Position;
}) {
  const s1_x = p1.x - p0.x;
  const s1_y = p1.y - p0.y;
  const s2_x = p3.x - p2.x;
  const s2_y = p3.y - p2.y;

  const s =
    (-s1_y * (p0.x - p2.x) + s1_x * (p0.y - p2.y)) /
    (-s2_x * s1_y + s1_x * s2_y);
  const t =
    (s2_x * (p0.y - p2.y) - s2_y * (p0.x - p2.x)) /
    (-s2_x * s1_y + s1_x * s2_y);

  if (s > 0 && s < 1 && t > 0 && t < 1) {
    return { x: p0.x + t * s1_x, y: p0.y + t * s1_y };
  }
  if (
    collinear({
      A: p0,
      B: p1,
      C: p2,
      D: p3,
    })
  ) {
    return true;
  }
  return null;
}

function pointsEqual(A: Position, B: Position) {
  return A.x === B.x && A.y === B.y;
}

export function collinear({
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
  //var det;
  //det = (B.x - A.x) * (D.y - C.y) - (D.x - C.x) * (B.y - A.y);
  // FIXME
  return (
    (isOnLine(A, B, C) && !pointsEqual(A, C) && !pointsEqual(B, C)) ||
    (isOnLine(A, B, D) && !pointsEqual(A, D) && !pointsEqual(B, D))
  );
}

function isOnLine(a: Position, b: Position, c: Position) {
  // Return true iff point c intersects the line segment from a to b.
  return (
    collinearPoints(a, b, c) &&
    (a.x !== b.x ? within(a.x, c.x, b.x) : within(a.y, c.y, b.y))
  );
}

function collinearPoints(a: Position, b: Position, c: Position) {
  // Return true iff a, b, and c all lie on the same line.
  return (b.x - a.x) * (c.y - a.y) === (c.x - a.x) * (b.y - a.y);
}

function within(p: number, q: number, r: number) {
  // Return true iff q is between p and r (inclusive).
  return (p <= q && q <= r) || (r <= q && q <= p);
}

export function generateMap(mapSettings: MapSettings): GameMap {
  const map: GameMap = {
    id: "generated",
    name: generateRegion(),
    background: "", // todo
    destinations: [],
    lines: [],
    routes: [], // todo
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
    players: mapSettings.players, // todo: balance
    canMonopolizeLineMin: mapSettings.canMonopolizeLineMin, // todo: balance
    size: mapSettings.size,
  };

  const margins = {
    left: 1,
    right: 2,

    top: 1,
    bottom: 1,
  };
  const tracks = {
    x:
      Math.floor(mapSettings.size.width / CELL_SIZE) -
      margins.left -
      margins.right,
    y:
      Math.floor(mapSettings.size.height / CELL_SIZE) -
      margins.top -
      margins.bottom,
  };
  while (map.destinations.length < mapSettings.cities) {
    const candidate = {
      name: generateCity(),
      position: {
        x: Math.round(tracks.x * Math.random()) + margins.left,
        y: Math.round(tracks.y * Math.random()) + margins.top,
      },
    };
    if (map.destinations.some((city) => distance(city, candidate) <= 0.8)) {
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

  const destinations = Object.fromEntries(
    map.destinations.map((destination) => [destination.name, destination])
  );
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
      isFerry: false, // todo
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

  // Build a graph
  const graph = new UndirectedGraph();
  map.destinations.forEach((destination) => graph.addNode(destination.name));
  console.log(graph.nodes(), map.destinations, map.lines);
  map.lines.forEach((line) =>
    graph.addEdge(line.start, line.end, {
      weight: line.length + (line.isFerry ? 1 : 0) + (line.isTunnel ? 1 : 0),
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
      weight: line.length + (line.isFerry ? 1 : 0) + (line.isTunnel ? 1 : 0),
    });
    return (
      newScores.reduce((a, b) => a + b, 0) -
      oldScores.reduce((a, b) => a + b, 0)
    );
  });
  sortBy(
    map.lines.map((line, idx) => [line, idx] as [Line, number]),
    ([line, idx]) => lineImportance[idx]
  )
    .slice(0, Math.ceil(map.lines.length / 5))
    .forEach(([line, idx]) => {
      map.lines[idx].color.push(
        choose(Object.fromEntries(Object.keys(trainColors).map((e) => [e, 1])))
      );
    });

  return map;
}
