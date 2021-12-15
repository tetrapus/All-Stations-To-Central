const getColor = () => Math.floor(Math.random() * 191 + 64);

export const generateColor = () =>
  `linear-gradient(to bottom right, rgba(${getColor()}, ${getColor()}, ${getColor()}, 1), rgba(${getColor()}, ${getColor()}, ${getColor()}, 1))`;
