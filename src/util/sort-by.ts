export function sortBy<T>(
  arr: T[],
  keyFn: (value: T) => number,
  ascending?: boolean
) {
  return arr
    .map((value) => ({ value, key: keyFn(value) }))
    .sort((a, b) => (b.key - a.key) * (ascending ? -1 : 1))
    .map(({ value }) => value);
}
