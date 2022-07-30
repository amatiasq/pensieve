import { useEffect, useState } from 'react';
import { Note } from '../2-entities/Note';
import StringComparer from '../util/StringComparer';
import { useStore } from './useStore';

const uniq = <T>(list: T[]) => Array.from(new Set(list));

let lastIteration = 0;

export function useFilteredNotes(
  list: Note[],
  comparer: StringComparer | null,
) {
  const [value, setValue] = useState<Note[]>([]);
  const [cursor, setCursor] = useState(0);
  const store = useStore();

  useEffect(() => {
    if (!comparer) return;

    const title = list.filter(note => comparer.matches(note.title));
    const group = list.filter(
      note => note.group && comparer.matches(note.group),
    );
    const id = list.filter(note => comparer.matches(note.id));

    setCursor(0);
    setValue(uniq([...title, ...group, ...id]));
  }, [list, comparer]);

  if (!comparer) return list;

  const currentIteration = ++lastIteration;

  // not awaited, this happens in the background
  setTimeout(searchInContent, 10);

  return value;

  // read notes one by one from cache
  // sequentially asynchronously
  async function searchInContent() {
    // if the counter is different ABORT!
    // that means another setTimeout is running after this one
    if (currentIteration !== lastIteration) {
      return;
    }

    const ids = new Set(value.map(x => x.id));

    for (let i = cursor; i < list.length; i++) {
      const note = list[i];

      if (ids.has(note.id)) {
        continue;
      }

      const remote = store.note(note.id);
      const content = await remote.readFromCache();

      if (content && comparer!.matches(content)) {
        setCursor(i + 1);
        setValue([...value, note]);
        break;
      }
    }
  }
}
