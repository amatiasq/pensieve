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
        `Error in JSON (${error.message}):\n${clean.substr(
          parseInt(position, 10) - 100,
          200,
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
  } catch (error) {
    return false;
  }
}

export type SerializedDate = '[string SerializedDate]';

export function datestr(date = new Date()) {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const min = pad(date.getMinutes());
  const sec = pad(date.getSeconds());
  const str = `${year}-${month}-${day} ${hour}:${min}:${sec}`;
  return str as SerializedDate;
}

export function parseDate(str: SerializedDate) {
  return new Date(str);
}

function pad(x: number) {
  return x < 10 ? `0${x}` : `${x}`;
}
