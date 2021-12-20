import { Line, TrainColor } from "data/Game";

export type LineSelection = (
  | {
      type: "line";
      line: Line;
      lineNo: number;
      colorNo: number;
    }
  | { type: "station"; city: number }
) & { selection: TrainColor[] };
