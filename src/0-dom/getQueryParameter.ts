export function getQueryParameter<T>(name: string, defaultValue: T) {
  return new URLSearchParams(location.search).get(name) || defaultValue;
}
