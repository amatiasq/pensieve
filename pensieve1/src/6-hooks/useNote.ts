import { useEffect, useState } from 'react';
import { isNoteIdentical, Note, NoteContent, NoteId } from '../2-entities/Note';
import { useStore } from './useStore';

export function useNote(id: NoteId) {
  const store = useStore();
  const remote = store.note(id);

  const bump = () => store.note(id).bump();
  const toggleFavorite = () => store.note(id).toggleFavorite();
  const remove = () => store.note(id).delete();
  const draft = (content: NoteContent) => store.note(id).draft(content);

  const [value, setValue] = useState<Note | null>(remote.get());
  const [loading, setLoading] = useState(!value);

  useEffect(() => {
    const note = remote.get();

    if (note) {
      initialize(note);
    } else {
      setLoading(true);
    }

    const subs = [remote.onChange(initialize), remote.onDraft(initialize)];
    return () => subs.forEach(x => x());
  }, [id]);

  return [value, { loading, toggleFavorite, remove, bump, draft }] as const;

  function initialize(newValue: Note) {
    if (!isNoteIdentical(newValue, value)) {
      setValue(newValue);
    }

    if (loading) {
      setLoading(false);
    }
  }
}
