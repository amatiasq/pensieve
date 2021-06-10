import { Note } from '../entities/Note';
import { hookStore } from './helpers/hookStore';

export const useNotesList = hookStore<Note[], []>([], () => (store, setValue) => {
  store.getNotes().then(setValue);
  return store.onNotesChange(setValue);
});
