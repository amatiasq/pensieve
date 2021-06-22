export function fetchValue<T>(
  local: Promise<T>,
  remote: Promise<T>,
  isValid: (x: T) => boolean,
  patch: (x: T) => void,
) {
  return local.then(
    cached => {
      if (!isValid(cached)) {
        return remote;
      }

      remote.then(patch);
      return cached;
    },
    () => remote,
  );
}
