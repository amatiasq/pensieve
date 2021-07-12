import { useContext } from 'react';

import { NotesStorageContext } from '../5-app/contexts';

export function useStore() {
  return useContext(NotesStorageContext);
}
