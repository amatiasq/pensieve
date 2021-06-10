export function isIdentical<T>(first: T, second: T) {
  return JSON.stringify(first) === JSON.stringify(second);
}
