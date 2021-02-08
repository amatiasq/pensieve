import './App.scss';

import React from 'react';
import { render } from 'react-dom';
import { BrowserRouter, Route } from 'react-router-dom';

import { EditGist } from './EditGist';
import { GistList } from './GistList';
import { useGithubAuth } from '../hooks/useGithubAuth';

function App() {
  if (!useGithubAuth()) {
    return <p>Loading...</p>;
  }

  return (
    <div className="app">
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
