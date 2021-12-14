const getColor = () => Math.floor(Math.random() * 255);

export const generateColor = () =>
  `linear-gradient(to bottom right, rgba(${getColor()}, ${getColor()}, ${getColor()}, 1), rgba(${getColor()}, ${getColor()}, ${getColor()}, 1))`;
