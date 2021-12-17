import { Player, TrainColor, trainColors } from "data/Game";
import { sortBy } from "./sort-by";

export const getCardCounts = (me: Player): [TrainColor, number][] =>
  me
    ? sortBy(
        Object.keys(trainColors)
          ?.map((color): [string, number] => [
            color,
            me.hand.filter((card) => card.color === color).length,
          ])
          .filter(([, count]) => count),
        (v) => v[1]
      )
    : [];
