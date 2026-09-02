import { useEffect, useState } from 'react';
import { isNoteIdentical, Note, NoteId } from '../2-entities/Note.ts';
import { parseDate } from '../util/datestr.ts';
import { useStore } from './useStore.ts';

export function useNoteList() {
  const store = useStore();
  const [loading, setLoading] = useState(true);
  const [value, setValue] = useState<Note[]>([]);

  useEffect(() => {
    if (!loading) {
      setLoading(true);
    }

    // Si no hay ni caché ni remoto, esto falla. Sin recogerlo la lista se queda
    // girando para siempre y no dice nada.
    store.all().then(replaceAll, reason => {
      console.error('Failed to load the note list', reason);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const remotes = value.map(x => store.note(x.id));

    const subs: Array<() => void> = [
      store.onNotesCreated(addNotes),
      ...remotes.map(x => x.onChange(updateNote)),
      ...remotes.map(x => x.onDelete(onRemove(x.id))),
    ];

    return () => subs.forEach(x => x());
  }, [value]);

  return [value, loading] as const;

  // Cada cambio parte de la lista de ahora, no de la del render que lo
  // suscribió. Un snapshot crea la copia y sube la original acto seguido, y con
  // la lista vieja el segundo evento borraba la copia de la barra.
  function setNotes(operator: (current: Note[]) => Note[]) {
    setValue(current => {
      const next = operator(current);
      return listAreIdentical(current, next) ? current : sort(next);
    });

    setLoading(false);
  }

  function replaceAll(notes: Note[]) {
    setNotes(() => notes);
  }

  function addNotes(notes: Note[]) {
    const newIds = notes.map(x => x.id);
    setNotes(current => [
      ...notes,
      ...current.filter(x => !newIds.includes(x.id)),
    ]);
  }

  function updateNote(note: Note) {
    setNotes(current => {
      const index = current.findIndex(x => x.id === note.id);

      // La nota puede haberse borrado entre el cambio y este render.
      if (index === -1) return current;

      return [...current.slice(0, index), note, ...current.slice(index + 1)];
    });
  }

  function onRemove(id: NoteId) {
    return () => setNotes(current => current.filter(x => x.id !== id));
  }
}

function listAreIdentical(a: Note[], b: Note[]) {
  return a.length === b.length && a.every((x, i) => isNoteIdentical(x, b[i]));
}

// Las fechas se guardan al segundo, así que una nota recién creada y el bump de
// otra empatan a menudo — es lo que hace un snapshot. El empate lo gana la más
// antigua: la copia no adelanta a la nota de la que salió.
function sort(list: Note[]) {
  const date = (x: Note) => Number(parseDate(x.bumped || x.created));
  const born = (x: Note) => Number(parseDate(x.created));
  return list.sort((a, b) => date(b) - date(a) || born(a) - born(b));
}
