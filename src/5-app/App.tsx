import './App.scss';
import './shortcuts';

import React, { useEffect, useState } from 'react';
import { render } from 'react-dom';
import { BrowserRouter, Route, useLocation } from 'react-router-dom';

// import { Placeholder } from '../7-components/Placeholder';
import { createStore } from '../4-storage';
import { AppStorage } from '../4-storage/AppStorage';
// Only exception to layer hierarchy
// import { EditGistFromUrl } from '../7-components/EditGist/EditGistFromUrl';
import { Navigation } from '../7-components/Navigation';
import { EditNoteFromUrl } from '../7-components/NoteEditor/EditNoteFromUrl';
import { NotesList } from '../7-components/NotesList/NotesList';
import { AppStorageContext } from './contexts';
import { useGithubAuth } from './useGithubAuth';

function App() {
  const location = useLocation();
  const page = getPageFromPath(location.pathname);
  const [store, setStore] = useState<AppStorage>(null!);
  const token = useGithubAuth();

  useEffect(() => {
    if (!token) return;
    createStore(token, 'amatiasq', 'pensieve-data').then(setStore);
  }, [token]);

  if (!store) {
    return <p>Loading...</p>;
  }

  return (
    <AppStorageContext.Provider value={store}>
      <div className={`app page-${page}`}>
        <Navigation />
        <NotesList />
        {/* <Route path="/" component={Placeholder} exact /> */}
        <Route path="/note/:gistId" component={EditNoteFromUrl}></Route>
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

function getPageFromPath(path: string) {
  if (path === '/') return 'home';
  const [, start] = path.split('/');
  return start;
}
