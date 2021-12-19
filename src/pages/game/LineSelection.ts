import { Line, TrainColor } from "data/Game";

export interface LineSelection {
  line: Line;
  lineNo: number;
  colorNo: number;
  selection: TrainColor[];
}
