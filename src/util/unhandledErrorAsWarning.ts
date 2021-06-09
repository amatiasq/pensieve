type ErrorCtor<T extends Error> = { new (): T };

const types: ErrorCtor<Error>[] = [];

window.addEventListener('unhandledrejection', event => {
  for (const type of types) {
    if (event.reason instanceof type) {
      event.preventDefault();
      console.warn(event.reason.message);
      return;
    }
  }
});

export function unhandledErrorAsWarning<T extends Error>(type: ErrorCtor<T>) {
  types.push(type);
}
