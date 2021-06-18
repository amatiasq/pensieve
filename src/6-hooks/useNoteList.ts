import { Note } from '../2-entities/Note';
import { hookStore } from './helpers/hookStore';

export const useNotesList = hookStore<Note[], []>(
  [],
  () => (store, setValue) => {
    const sus = store.getNotes().subscribe(setValue);
    return () => sus.unsubscribe();
  },
);
