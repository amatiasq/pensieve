import { useEffect, useState } from 'react';
import { Note } from '../2-entities/Note.ts';
import type StringComparer from '../util/StringComparer.ts';
import { useStore } from './useStore.ts';

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

    const found = comparer.matchesList(list, ['title', 'group']);

    setCursor(0);
    setValue(found);
  }, [list, comparer]);

  const currentIteration = ++lastIteration;
  if (!comparer) return list;
  setTimeout(searchInContent, 10);
  return value;

  // read notes one by one from cache
  // sequentially asynchronously
  async function searchInContent() {
    const isAnotherSearchRunning = () => currentIteration !== lastIteration;
    if (isAnotherSearchRunning()) return;

    const shownIds = new Set(value.map(x => x.id));

    for (let i = cursor; i < list.length; i++) {
      const note = list[i];

      if (shownIds.has(note.id)) continue;

      const remote = store.note(note.id);
      const content = await remote.readFromCache();
      if (isAnotherSearchRunning()) return;

      if (content && comparer!.matches(content)) {
        setCursor(i + 1);
        setValue([...value, note]);
        return;
      }
    }
  }
}
