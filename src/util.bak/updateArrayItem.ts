export function updateArrayItem<T>(
  list: T[],
  item: T,
  comparer: (a: T, b: T) => boolean,
) {
  const index = list.findIndex(x => comparer(item, x));

  return index === -1
    ? list
    : [...list.slice(0, index), item, ...list.slice(index + 1)];
}
