import { choose } from "./citygen";

const colors =
  "aae4ff ff8eb6 ffeba8 007fed f52068 fc8c14 363f4d f7f7f7 c2ebbc 4fb55d ffb7a3 e02a28 7d30c9 ffeb3b 00cdd4 24b391".split(
    " "
  );

const getColor = () =>
  `#${choose(Object.fromEntries(colors.map((color) => [color, 1])))}`;

export const generateColor = () =>
  `linear-gradient(to bottom right, ${getColor()}, ${getColor()})`;
