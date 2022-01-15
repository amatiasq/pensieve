export function errorFor<T>(action: () => T, message: string, ...other: any[]) {
  try {
    return action();
  } catch (error) {
    console.error(`ERROR: ${message}`);
    console.debug(`ERROR: ${message}`);
    console.debug(error);

    if (other.length) {
      console.debug('Reported debug values:', ...other);
    }

    // throw new Error(message);
  }
}
