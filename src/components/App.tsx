import './App.scss';

import React from 'react';
import { render } from 'react-dom';
import { BrowserRouter, Route, useLocation } from 'react-router-dom';

import { useGithubAuth } from '../hooks/useGithubAuth';
import { EditGistFromUrl } from './EditGist/EditGistFromUrl';
import { GistList } from './GistList/GistList';
import { Placeholder } from './Placeholder';

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
  const [_, start] = path.split('/');
  return start;
}
