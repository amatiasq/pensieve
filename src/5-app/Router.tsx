import React from 'react';
import { Route } from 'react-router-dom';

import { useNavigator } from '../6-hooks/useNavigator';
import { useShortcut } from '../6-hooks/useShortcut';
import { CreateNote } from '../7-components/routes/CreateNote';
import { EditNoteFromUrl } from '../7-components/routes/EditNoteFromUrl';
import { EditSettings } from '../7-components/routes/EditSettings';

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
