import { NoteId } from '../2-entities/Note.ts';
import { snapshotContent } from '../2-entities/snapshotContent.ts';
import { useStore } from './useStore.ts';

// No navega a la copia: un snapshot archiva un estado, no es un sitio al que ir.
export function useSnapshotNote(id: NoteId) {
  const store = useStore();

  return async () => {
    const note = store.note(id);
    const content = await note.read().catch(() => null);

    // Sin contenido el snapshot sería una nota vacía, y una nota vacía se lee
    // como una copia buena de lo que no se pudo leer.
    if (!content) {
      alert(`Couldn't read "${note.title}", no snapshot taken.`);
      return;
    }

    store.create(snapshotContent(content));
  };
}
