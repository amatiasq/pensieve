import { useContext, useEffect, useState } from 'react';

import { AppStorageContext } from '../5-app/contexts';
import { NoteId } from '../entities/Note';

export function useNoteContent(id: NoteId) {
  const store = useContext(AppStorageContext);
  const [value, setValue] = useState('');

  useEffect(() => {
    store.fetchNoteContent(id).then(setValue);
    return store.onNoteContentChanged(id, x => setValue(x.content)) as () => void;
  }, [id]);

  return value;
}
