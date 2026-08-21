import { useEffect, useRef, useState } from 'react';
import { NoteContent, NoteId } from '../2-entities/Note.ts';
import { WriteOptions } from '../4-storage/helpers/WriteOptions.ts';
import { useStore } from './useStore.ts';

export function useNoteContent(id: NoteId) {
  const store = useStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [value, setValue] = useState<NoteContent>('');

  // La nota que se está pidiendo ahora. El efecto no se vuelve a crear cuando
  // cambia `loading` o `value`, así que lo que capturó sigue siendo lo de la
  // nota anterior: sin esto, lo que llega tarde de una nota se pinta en otra.
  const requested = useRef(id);

  useEffect(() => {
    requested.current = id;
    setValue('');
    setLoading(true);
    setError(null);

    const remote = store.note(id);

    remote.read().then(
      content => receive(id, content),
      reason => fail(id, reason),
    );

    return remote.onContentChange(content => receive(id, content));
  }, [id]);

  return [value, set, loading, error] as const;

  function receive(forId: NoteId, newValue: NoteContent | null) {
    if (requested.current !== forId) return;

    setValue(newValue || '');
    setLoading(false);
    setError(null);
  }

  function fail(forId: NoteId, reason: unknown) {
    if (requested.current !== forId) return;

    console.error(`Failed to read note ${forId}`, reason);
    setLoading(false);
    setError(reason instanceof Error ? reason : new Error(String(reason)));
  }

  // Guardar no es cargar: marcarlo como «cargando» desmontaba el editor a media
  // escritura y se perdía el cursor.
  function set(content: NoteContent, options?: WriteOptions) {
    store.note(id).write(content, options);
  }
}
