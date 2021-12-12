import { Destination, Map, Position, trainColors } from "data/Game";
import { choose, generateCity, generateRegion } from "./citygen";
import { sortBy } from "./sort-by";

interface MapSettings {
  cities: number;
  connectivity: number;
  tunnels: number;
  ferries: number;
  players: { min: number; max: number };
  canMonopolizeLineMin: number;
  scoringTable: { [key: number]: number };
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

const granularity = 2;

export function generateMap(mapSettings: MapSettings): Map {
  const map: Map = {
    id: "generated",
    name: generateRegion(),
    background: "", // todo
    destinations: [], // todo
    lines: [], // todo
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
    }, // todo
    bonuses: [], // todo
    scoringTable: mapSettings.scoringTable, // todo
    players: mapSettings.players, // todo: balance
    canMonopolizeLineMin: mapSettings.canMonopolizeLineMin, // todo: balance
  };

  while (map.destinations.length < mapSettings.cities) {
    const candidate = {
      name: generateCity(),
      position: {
        x: Math.round(14 * Math.random() * granularity) / granularity + 0.5,
        y: Math.round(8 * Math.random() * granularity) / granularity + 0.5,
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
  return map;
}
