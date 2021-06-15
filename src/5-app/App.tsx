import './App.scss';
import './shortcuts';

import React, { useEffect, useState } from 'react';
import { render } from 'react-dom';
import { BrowserRouter, Route } from 'react-router-dom';

// import { Placeholder } from '../7-components/Placeholder';
import { createStore, TypedStorage } from '../4-storage';
import { useNavigator } from '../6-hooks/useNavigator';
import { Loader } from '../7-components/atoms/Loader';
// Only exception to layer hierarchy
// import { EditGistFromUrl } from '../7-components/EditGist/EditGistFromUrl';
import { EditNoteFromUrl } from '../7-components/NoteEditor/EditNoteFromUrl';
import { NotesList } from '../7-components/NotesList/NotesList';
import { AppStorageContext } from './contexts';
import { useGithubAuth } from './useGithubAuth';

function App() {
  const [store, setStore] = useState<TypedStorage>(null!);
  const { token, username } = useGithubAuth();
  const navigator = useNavigator();
  const [pageName, setPageName] = useState(navigator.getPageName());

  useEffect(() => {
    if (!token || !username) return;
    createStore(token, username, 'pensieve-data').then(setStore);
  }, [token]);

  useEffect(() =>
    navigator.onNavigate(next => setPageName(next.getPageName())),
  );

  if (!store) {
    return <Loader />;
  }

  return (
    <AppStorageContext.Provider value={store}>
      <div className={`app page-${pageName}`}>
        <NotesList />
        {/* <Route path="/" component={Placeholder} exact /> */}
        {/* <Route path="/sketch" component={SketchPad} /> */}
        {/* <Route path="/settings" component={EditSettings} /> */}
        <Route path={navigator.note} component={EditNoteFromUrl}></Route>
        {/* <Route path="/gist/:gistId/:filename" component={EditGistFromUrl}></Route> */}
      </div>
    </AppStorageContext.Provider>
  );
}

export function renderApp(container: HTMLElement): void {
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>,
    container,
  );
}
