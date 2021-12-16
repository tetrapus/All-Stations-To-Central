export function indexBy<T extends { [key: string]: any }>(
  objects: T[],
  attribute: string
): { [key: string]: T } {
  return Object.fromEntries(
    objects.map((object) => [object[attribute] as string, object])
  );
}
