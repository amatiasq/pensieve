import { useEffect, useState } from 'react';

import { Note } from '../2-entities/Note';
import StringComparer from '../util/StringComparer';
import { useStore } from './useStore';

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

    setCursor(0);
    setValue(
      list.filter(note =>
        comparer.matchesAny([note.id, note.title, note.group]),
      ),
    );
  }, [list, comparer]);

  if (!comparer) return list;

  const currentIteration = ++lastIteration;

  // not awaited
  setTimeout(searchInContent, 10);

  return value;

  // secuencialmente de forma asíncrona
  // leer las notas una por una
  // si el contador cambia ABORTAR

  async function searchInContent() {
    if (currentIteration !== lastIteration) {
      return;
    }

    for (let i = cursor; i < list.length; i++) {
      const note = list[i];

      if (value.includes(note)) {
        continue;
      }

      const remote = store.note(note.id);

      if (await remote.hasCachedContent) {
        const content = await remote.read();

        if (comparer!.matches(content)) {
          setCursor(i + 1);
          setValue([...value, note]);
          break;
        }
      }
    }
  }
}
