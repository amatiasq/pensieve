import './App.scss';

import React from 'react';
import { render } from 'react-dom';
import { BrowserRouter, Route, useLocation } from 'react-router-dom';

import { useGithubAuth } from '../hooks/useGithubAuth';
import { EditGist } from './EditGist/EditGist';
import { GistList } from './GistList/GistList';

function App() {
  const location = useLocation();
  const page = getPageFromPath(location.pathname);

  if (!useGithubAuth()) {
    return <p>Loading...</p>;
  }

  return (
    <div className={`app page-${page}`}>
      <GistList />
      <Route path="/" component={() => <div></div>} exact />
      <Route path="/:gistId/:filename" component={EditGist}></Route>
    </div>
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
  if (path.split('/').length === 3) return 'gist';
  throw new Error(`Unknown page "${path}"`);
}
