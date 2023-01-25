import { useEffect, useState } from 'react';
import { isNoteIdentical, Note, NoteId } from '../2-entities/Note';
import { parseDate } from '../util/serialization';
import { useStore } from './useStore';

export function useNoteList() {
  const store = useStore();
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

  return [value, loading] as const;

  function initialize(notes: Note[]) {
    if (!listAreIdentical(value, notes)) {
      const sorted = sort(notes);
      setValue(sorted);
    }

    if (loading) {
      setLoading(false);
    }
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
  const date = (x: Note) => Number(parseDate(x.bumped || x.created));
  return list.sort((a, b) => date(b) - date(a));
}
