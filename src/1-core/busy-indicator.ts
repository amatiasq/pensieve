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
  return promise.finally(finish);
}

function notifyChange() {
  const newState = Boolean(operations.size);

  if (newState === currentState) {
    return;
  }

  currentState = newState;
  emit(newState);
}
