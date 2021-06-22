import { useContext, useEffect, useState } from 'react';

import { isNoteIdentical, Note } from '../2-entities/Note';
import { NotesStorageContext } from '../5-app/contexts';
import { datestr } from '../util/serialization';
import { useNavigator } from './useNavigator';

export function useNoteList() {
  const navigator = useNavigator();
  const store = useContext(NotesStorageContext);
  const [loading, setLoading] = useState(true);
  const [value, setValue] = useState<Note[]>([]);

  const addNote = (note: Note) => initialize([note, ...value]);

  useEffect(() => {
    if (!loading) {
      setLoading(true);
    }

    const subs: Array<() => void> = [store.onNoteCreated(addNote)];

    store.all().then(notes => {
      initialize(notes.map(x => x.get()!));
      subs.push(...notes.map(x => x.onChange(updateNote)));
    });

    return () => subs.forEach(x => x());
  }, []);

  return [value, { loading, createNote }] as const;

  function initialize(notes: Note[]) {
    if (!listAreIdentical(value, notes)) {
      // SORT HERE
      setValue(notes);
    }

    if (loading) {
      setLoading(false);
    }
  }

  function createNote() {
    const remote = store.create(`${datestr()}\n`);
    navigator.goNote(remote.id);
  }

  function updateNote(note: Note) {
    const { id } = note;
    const index = value.findIndex(x => x.id === id);

    if (index === -1) {
      throw new Error(`Unknown note updated: ${id}`);
    }

    const before = value.slice(0, index);
    const after = value.slice(index + 1);
    initialize([...before, note, ...after]);
  }
}

function listAreIdentical(a: Note[], b: Note[]) {
  return a.length === b.length && a.every((x, i) => isNoteIdentical(x, b[i]));
}
