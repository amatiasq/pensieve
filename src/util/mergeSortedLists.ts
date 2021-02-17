export function mergeSortedLists<T>(
  stored: T[],
  incoming: T[],
  comparer: (a: T, b: T) => boolean,
) {
  const result: T[] = [];
  let isStoredObsolete = false;

  // eslint-disable-next-line no-constant-condition
  for (let ii = 0, si = 0; true; ii++) {
    // end of stored
    if (si === stored.length) {
      isStoredObsolete = true;
      result.push(...incoming.slice(ii));
      break;
    }

    // end of incoming
    if (ii === incoming.length) {
      // Unnecesary since we're going to return stored
      // result.push(...stored.slice(si));
      break;
    }

    result.push(incoming[ii]);

    // happy path
    if (comparer(stored[si], incoming[ii])) {
      si++;
      continue;
    }

    isStoredObsolete = true;

    // search the missing-existing entry in stored
    const exists = stored.findIndex(x => comparer(x, incoming[ii]));

    // item found at ${exists}
    if (exists !== -1) {
      si = exists + 1;
    }

    // if doesn't exists then it's new
  }

  return isStoredObsolete ? result : stored;
}
