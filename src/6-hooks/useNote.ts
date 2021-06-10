import { useContext, useEffect, useState } from 'react';

import { onPageVisibilityChange } from '../4-dom/page-visibility';
import { AppStorageContext } from '../5-app/contexts';
import { Note, NoteId } from '../entities/Note';
import { isIdentical } from '../util/isIdentical';
import { Stopwatch } from '../util/Stopwatch';
import { useSetting } from './useSetting';

export function useNote(id: NoteId) {
  const store = useContext(AppStorageContext);
  const [value, setValue] = useState<Note | null>(null);
  const [reloadAfterSeconds] = useSetting('reloadIfAwayForSeconds');

  useEffect(() => {
    store.getNote(id).then(setValue);
    return store.onNoteChanged(id, setValue) as () => void;
  }, [id]);

  useEffect(() =>
    whenBackAfterSeconds(reloadAfterSeconds, async () => {
      if (!value) return;

      const note = await store.getNote(id);

      if (!isIdentical(value, note)) {
        setValue(note);
      }
    }),
  );

  return value;
}

const away = new Stopwatch();

function whenBackAfterSeconds(seconds: number, listener: () => void) {
  return onPageVisibilityChange(isVisible => {
    if (!isVisible) {
      away.start();
      return;
    }

    if (seconds && away.seconds > seconds) {
      listener();
    }

    away.stop();
  });
}
