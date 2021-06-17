import { Subject } from 'rxjs';

export function subjectWithChannels<T>() {
  const map = new Map<string, Subject<T>>();

  return (key: string) => {
    if (map.has(key)) {
      return map.get(key)!;
    }

    const subject = new Subject<T>();
    map.set(key, subject);
    return subject;
  };
}
