import { Note, NoteId } from '../entities/Note';
import { hookStore } from './helpers/hookStore';

export const useNote = hookStore<Note | null, [NoteId]>(null, id => (store, setValue) => {
  store.getNote(id).then(setValue);
  return store.onNoteChanged(id, setValue);
});
