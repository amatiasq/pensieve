import JSON5 from 'json5';

export function serialize(x: any) {
  return JSON.stringify(x, null, 2);
}

export function deserialize<T = any>(x: string) {
  const clean = x.replace(/[^:]\/\/[^\n]+\n/g, '');

  try {
    return JSON5.parse(clean) as T;
  } catch (error) {
    if (error instanceof Error) {
      const [position] = error.message.split(/\s/g).reverse();
      console.warn(
        `Error in JSON (${error.message}):\n${clean.slice(
          parseInt(position, 10) - 100,
          parseInt(position, 10) + 100,
        )}`,
      );
    }
    throw error;
  }
}

export function isDeserializable(x: string) {
  try {
    deserialize(x);
    return true;
  } catch {
    return false;
  }
}
