import { useContext, useEffect, useState } from 'react';

import { AppStorageContext } from '../5-app/contexts';
import { Note } from '../entities/Note';

export function useGistList() {
  const store = useContext(AppStorageContext);
  const [list, setList] = useState<Note[]>([]);

  useEffect(() => {
    store.fetchNotes().then(setList);
    return store.onNotesChange(setList);
  });

  return list;
}
