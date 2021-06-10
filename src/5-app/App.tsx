import './App.scss';
import './shortcuts';

import React, { useState } from 'react';
import { render } from 'react-dom';
import { BrowserRouter, Route, useLocation } from 'react-router-dom';

// Only exception to layer hierarchy
import { EditGistFromUrl } from '../7-components/EditGist/EditGistFromUrl';
import { GistList } from '../7-components/GistList/GistList';
import { Placeholder } from '../7-components/Placeholder';
import { createStore } from '../storage';
import { AppStorage } from '../storage/AppStorage';
import { AppStorageContext } from './contexts';
import { useGithubAuth } from './useGithubAuth';

function App() {
  const location = useLocation();
  const page = getPageFromPath(location.pathname);
  const [store, setStore] = useState<AppStorage>(null!);
  const token = useGithubAuth();

  if (!token) {
    return <p>Loading...</p>;
  }

  if (!store) {
    setStore(createStore(token, 'amatiasq', 'app-notes'));
    return null;
  }

  return (
    <AppStorageContext.Provider value={store}>
      <div className={`app page-${page}`}>
        <GistList />
        <Route path="/" component={Placeholder} exact />
        <Route path="/gist/:gistId/:filename" component={EditGistFromUrl}></Route>
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
