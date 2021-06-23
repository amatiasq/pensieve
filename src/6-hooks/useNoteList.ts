import { useContext, useEffect, useState } from 'react';

import { isNoteIdentical, Note, NoteId } from '../2-entities/Note';
import { NotesStorageContext } from '../5-app/contexts';
import { datestr, parseDate } from '../util/serialization';
import { useNavigator } from './useNavigator';

export function useNoteList() {
  const navigator = useNavigator();
  const store = useContext(NotesStorageContext);
  const [loading, setLoading] = useState(true);
  const [value, setValue] = useState<Note[]>([]);

  useEffect(() => {
    if (!loading) {
      setLoading(true);
    }

    store.all().then(initialize);
  }, []);

  useEffect(() => {
    const remotes = value.map(x => store.note(x.id));

    const subs: Array<() => void> = [
      store.onNotesCreated(addNotes),
      ...remotes.map(x => x.onChange(updateNote)),
      ...remotes.map(x => x.onDelete(onRemove(x.id))),
    ];

    return () => subs.forEach(x => x());
  }, [value]);

  return [value, { loading, createNote }] as const;

  function initialize(notes: Note[]) {
    if (!listAreIdentical(value, notes)) {
      setValue(sort(notes));
    }

    if (loading) {
      setLoading(false);
    }
  }

  function createNote() {
    const remote = store.create(`${datestr()}.md\n`);
    navigator.goNote(remote.id);
  }

  function addNotes(notes: Note[]) {
    const newIds = notes.map(x => x.id);
    const previous = value.filter(x => !newIds.includes(x.id));
    initialize([...notes, ...previous]);
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

  function onRemove(id: NoteId) {
    return () => {
      setValue(value.filter(x => x.id !== id));
    };
  }
}

function listAreIdentical(a: Note[], b: Note[]) {
  return a.length === b.length && a.every((x, i) => isNoteIdentical(x, b[i]));
}

function sort(list: Note[]) {
  return list.sort(
    (a, b) => Number(parseDate(b.created)) - Number(parseDate(a.created)),
  );
}
