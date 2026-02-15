import { Route, Routes } from 'react-router-dom';
import { useNavigator } from '../6-hooks/useNavigator.ts';
import { useShortcut } from '../6-hooks/useShortcut.ts';
import { CreateNote } from '../7-components/routes/CreateNote.tsx';
import { EditNoteFromUrl } from '../7-components/routes/EditNoteFromUrl.tsx';
import { EditSettings } from '../7-components/routes/EditSettings.tsx';

export function Router() {
  const navigator = useNavigator();

  useShortcut('settings', () => navigator.goSettings());

  return (
    <Routes>
      <Route path={navigator.create} element={<CreateNote />} />
      <Route path={navigator.settings} element={<EditSettings />} />
      <Route path={navigator.note} element={<EditNoteFromUrl />} />
    </Routes>
  );
}
