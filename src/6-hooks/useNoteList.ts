import { Note } from '../2-entities/Note';
import { hookStore } from './helpers/hookStore';

export const useNotesList = hookStore<Note[], []>(
  [],
  () => (store, setValue) => {
    const subscription = store.getNotes().subscribe(setValue);
    return () => subscription.unsubscribe();
  },
);
