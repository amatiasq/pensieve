import { emitter } from '@amatiasq/emitter';

const operations = new Set();
let currentState = false;

const emit = emitter<boolean>();

export const onBusinessChange = emit.subscribe;

export function busy() {
  const identifier = {};
  operations.add(identifier);
  notifyChange();

  return () => {
    operations.delete(identifier);
    notifyChange();
  };
}

export function busyWhile<T>(promise: Promise<T>) {
  const finish = busy();
  promise.finally(finish);
  return promise;
}

function notifyChange() {
  const newState = Boolean(operations.size);

  if (newState === currentState) {
    return;
  }

  currentState = newState;
  emit(newState);
}
