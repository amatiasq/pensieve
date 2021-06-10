import { NoteContent, NoteId } from '../entities/Note';
import { hookStore } from './helpers/hookStore';

export const useNoteContent = hookStore<NoteContent, [NoteId]>('', id => (store, setValue) => {
  store.getNoteContent(id).then(setValue);
  return store.onNoteContentChanged(id, setValue);
});

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
