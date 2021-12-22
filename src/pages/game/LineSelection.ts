import { Line, TrainColor } from "data/Game";

export type LineSelection = (
  | {
      type: "line";
      line: Line;
      lineNo: number;
      colorNo: number;
    }
  | { type: "city"; city: number; destination?: number }
  | { type: "station"; city: number }
) & { selection: TrainColor[] };
