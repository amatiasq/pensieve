export function serialize(x: any) {
  return JSON.stringify(x, null, 2);
}

export function deserialize<T = any>(x: string) {
  const clean = x.replace(/[^:]\/\/[^\n]+\n/g, '');

  try {
    return JSON.parse(clean) as T;
  } catch (error) {
    const [position] = error.message.split(/\s/g).reverse();
    console.warn(
      `Error in JSON (${error.message}):\n${clean.substr(position - 100, 200)}`,
    );
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
