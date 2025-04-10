import { Route } from 'react-router-dom';
import { useNavigator } from '../6-hooks/useNavigator.ts';
import { useShortcut } from '../6-hooks/useShortcut.ts';
import { CreateNote } from '../7-components/routes/CreateNote.tsx';
import { EditNoteFromUrl } from '../7-components/routes/EditNoteFromUrl.tsx';
import { EditSettings } from '../7-components/routes/EditSettings.tsx';

export function Router() {
  const navigator = useNavigator();

  useShortcut('settings', () => navigator.goSettings());

  return (
    <>
      {/* <Route path="/" component={Placeholder} exact /> */}
      {/* <Route path="/sketch" component={SketchPad} /> */}
      <Route path={navigator.create} component={CreateNote} />
      <Route path={navigator.settings} component={EditSettings} />
      <Route path={navigator.note} component={EditNoteFromUrl} />
      {/* <Route path="/gist/:gistId/:filename" component={EditGistFromUrl}></Route> */}
    </>
  );
}
