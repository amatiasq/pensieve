export function removeIndexFomArray<T>(list: T[], index: number) {
  return [...list.slice(0, index), ...list.slice(index + 1)];
}
