import { Note, NoteId } from '../2-entities/Note';
import { hookStore } from './helpers/hookStore';

export const useNote = hookStore<Note | null, [NoteId]>(
  null,
  id => (store, setValue) => {
    const sus = store.getNote(id).subscribe(setValue);
    return () => sus.unsubscribe();
  },
);
