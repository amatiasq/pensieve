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

export function daystr(date = new Date()) {
  const [day] = datestr(date).split(' ');
  return day;
}

export function parseDate(str: SerializedDate) {
  return new Date(str);
}

function pad(x: number) {
  return x < 10 ? `0${x}` : `${x}`;
}
