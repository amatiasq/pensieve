import { useContext, useEffect, useState } from 'react';

import { isNoteIdentical, Note, NoteContent, NoteId } from '../2-entities/Note';
import { NotesStorageContext } from '../5-app/contexts';

export function useNote(id: NoteId) {
  const store = useContext(NotesStorageContext);
  const remote = store.note(id);

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

  return [value, { loading, toggleFavorite, remove, draft }] as const;

  function initialize(newValue: Note) {
    if (!isNoteIdentical(newValue, value)) {
      setValue(newValue);
    }

    if (loading) {
      setLoading(false);
    }
  }
}
