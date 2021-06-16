// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serialize(x: any) {
  return JSON.stringify(x, null, 2);
}

export function deserialize(x: string) {
  const clean = x.replace(/\/\/[^\n]+\n/g, '');

  try {
    return JSON.parse(clean);
  } catch (error) {
    console.warn(`Error in JSON (${error.message}):\n${x}`);
    throw error;
  }
}

export function isDeserializable(x: string) {
  try {
    deserialize(x);
    return true;
  } catch (error) {
    return false;
  }
}
