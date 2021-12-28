function range(n: number) {
  return [...Array(n).keys()];
}

export function nOf<T>(n: number, fun: (n: number) => T) {
  return range(n).map(fun);
}
