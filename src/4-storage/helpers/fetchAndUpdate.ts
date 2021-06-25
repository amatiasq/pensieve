export function fetchAndUpdate<T>(
  local: Promise<T>,
  remote: Promise<T>,
  patch: (x: T) => void,
  isValid: (x: T) => boolean = () => true,
) {
  let isLocalComplete = false;
  let isRemoteComplete = false;

  return new Promise<T>((resolve, reject) => {
    remote
      .finally(() => (isRemoteComplete = true))
      .then(
        x => {
          if (isLocalComplete) patch(x);
          else resolve(x);
        },
        e => {
          if (isLocalComplete) reject(e);
        },
      );

    local
      .finally(() => (isLocalComplete = true))
      .then(
        x => {
          if (isValid(x)) {
            resolve(x);
          }
        },
        e => {
          if (isRemoteComplete) {
            reject(e);
          }
        },
      );
  });
}
