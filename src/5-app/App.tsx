import './App.scss';
import './shortcuts';

import React from 'react';
import { render } from 'react-dom';
import { BrowserRouter, Route, useLocation } from 'react-router-dom';

import { EditGistFromUrl } from '../7-components/EditGist/EditGistFromUrl';
import { GistList } from '../7-components/GistList/GistList';
import { Placeholder } from '../7-components/Placeholder';
import { useGithubAuth } from './useGithubAuth';

function App() {
  const location = useLocation();
  const page = getPageFromPath(location.pathname);

  if (!useGithubAuth()) {
    return <p>Loading...</p>;
  }

  return (
    <div className={`app page-${page}`}>
      <GistList />
      <Route path="/" component={Placeholder} exact />
      <Route path="/gist/:gistId/:filename" component={EditGistFromUrl}></Route>
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
  const [, start] = path.split('/');
  return start;
}
