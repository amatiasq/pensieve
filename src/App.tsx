import './App.css';

import React from 'react';
import { render } from 'react-dom';
import { BrowserRouter, Route } from 'react-router-dom';

import { EditScript } from './components/EditScript';
import { NotesList } from './components/NotesList';

function App() {
  return (
    <div className="app">
      <Route path="/" component={NotesList} exact />
      <Route path="/:gistId/:filename" component={EditScript}></Route>
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
