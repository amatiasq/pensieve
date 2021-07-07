import './App.scss';

import React, { useEffect, useState } from 'react';

import { createStore } from '../4-storage';
import { NotesStorage } from '../4-storage/NotesStorage';
import { useNavigator } from '../6-hooks/useNavigator';
import { Loader } from '../7-components/atoms/Loader';
import { NotesStorageContext } from './contexts';
import { Router } from './Router';
import { useGithubAuth } from './useGithubAuth';

export function App() {
  const [store, setStore] = useState<NotesStorage>(null!);
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
    <NotesStorageContext.Provider value={store}>
      <div className={`app page-${pageName}`}>
        <Router />
      </div>
    </NotesStorageContext.Provider>
  );
}
