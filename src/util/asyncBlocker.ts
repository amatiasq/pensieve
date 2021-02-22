class AsynchronousTaskBlocked extends Error {}

window.addEventListener('unhandledrejection', event => {
  if (event.reason instanceof AsynchronousTaskBlocked) {
    event.preventDefault();
    console.warn(event.reason.message);
  }
});

export function asyncBlocker(name: string) {
  let isOperating = false;

  return <T>(fn: () => Promise<T> | void) => {
    if (isOperating) {
      return Promise.reject(
        new AsynchronousTaskBlocked(
          `Prevent ${fn.name || '(anoymous)'} to run ${name || '(unnamed)'}`,
        ),
      );
    }

    isOperating = true;
    return Promise.resolve(fn() || null).finally(() => {
      isOperating = false;
    });
  };
}
