import { emitter } from '@amatiasq/emitter';

const operations = new Set();
let currentState = false;

const emit = emitter<boolean>();

export const onBusinessChange = emit.subscribe;

function addBusinessIndicator() {
  const identifier = {};
  operations.add(identifier);
  notifyChange();

  return () => {
    operations.delete(identifier);
    notifyChange();
  };
}

export function busyWhile<T>(promise: Promise<T>) {
  const finish = addBusinessIndicator();
  promise.finally(finish);
  return promise;
}

// export function busyCall<Args extends any[], Result>(
//   fn: (...args: Args) => Promise<Result>,
// ) {
//   return (...args: Args) => busyWhile(fn(...args));
// }

function notifyChange() {
  const newState = Boolean(operations.size);

  if (newState === currentState) {
    return;
  }

  currentState = newState;
  emit(newState);
}
