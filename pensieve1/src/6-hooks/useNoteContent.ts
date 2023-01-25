import { useEffect, useState } from 'react';
import { NoteContent, NoteId } from '../2-entities/Note';
import { WriteOptions } from '../4-storage/helpers/WriteOptions';
import { useStore } from './useStore';

export function useNoteContent(id: NoteId) {
  const store = useStore();
  const [loading, setLoading] = useState(true);
  const [value, setValue] = useState<NoteContent>('');

  useEffect(() => {
    setValue('');

    if (!loading) {
      setLoading(true);
    }

    const remote = store.note(id);
    remote.read().then(initialize);
    return remote.onContentChange(initialize);
  }, [id]);

  return [value, set, loading] as const;

  function initialize(newValue: NoteContent | null) {
    if (newValue !== value) {
      setValue(newValue || '');
    }

    if (loading) {
      setLoading(false);
    }
  }

  function set(content: NoteContent, options?: WriteOptions) {
    setLoading(true);
    store.note(id).write(content, options);
  }
}

// export function useNoteContent(id: NoteId) {
//   const store = useContext(AppStorageContext);
//   const [value, setValue] = useState('');
//   const [reloadAfterSeconds] = useSetting('reloadIfAwayForSeconds');

//   useEffect(() => {
//     store.getNoteContent(id).then(setValue);
//     return store.onNoteContentChanged(id, setValue) as () => void;
//   }, [id]);

//   useEffect(() =>
//     whenBackAfterSeconds(reloadAfterSeconds, async () => {
//       const content = await store.getNoteContent(id);

//       if (content !== value) {
//         setValue(content);
//       }
//     }),
//   );

//   return value;
// }

// const away = new Stopwatch();

// function whenBackAfterSeconds(seconds: number, listener: () => void) {
//   return onPageVisibilityChange(isVisible => {
//     if (!isVisible) {
//       away.start();
//       return;
//     }

//     if (seconds && away.seconds > seconds) {
//       listener();
//     }

//     away.stop();
//   });
// }
