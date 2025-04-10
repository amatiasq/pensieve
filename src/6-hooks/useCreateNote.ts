import { datestr } from '../util/serialization.ts';
import { useNavigator } from './useNavigator.ts';
import { useStore } from './useStore.ts';

export function useCreateNote() {
  const store = useStore();
  const navigator = useNavigator();

  return () => {
    const remote = store.create(`${datestr()}.md\n`);
    navigator.goNote(remote.id);
  };
}
