import { datestr } from '../util/serialization';
import { useNavigator } from './useNavigator';
import { useStore } from './useStore';

export function useCreateNote() {
  const store = useStore();
  const navigator = useNavigator();

  return () => {
    const remote = store.create(`${datestr()}.md\n`);
    navigator.goNote(remote.id);
  };
}
