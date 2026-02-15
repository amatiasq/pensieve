import { Global } from '@emotion/react';
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ghRepository } from '../3-github/gh-utils.ts';
import { AppStorage } from '../4-storage/AppStorage.ts';
import { createStore } from '../4-storage/index.ts';
import { Loader } from '../7-components/atoms/Loader.tsx';
import { App } from './App.tsx';
import { StorageContext } from './contexts.ts';
import { globalStyles } from './theme.tsx';
import { useGithubAuth } from './useGithubAuth.ts';

export function renderApp(container: HTMLElement): void {
  createRoot(container).render(<Scaffold />);
}

function Scaffold() {
  const [store, setStore] = useState<AppStorage>(null!);
  const { token, username } = useGithubAuth();

  useEffect(() => {
    if (!token || !username) return;
    createStore(token, username, ghRepository).then(setStore);
  }, [token]);

  if (!store) {
    return <Loader />;
  }

  return (
    <BrowserRouter>
      <StorageContext.Provider value={store}>
        <Global styles={globalStyles} />
        <App />
      </StorageContext.Provider>
    </BrowserRouter>
  );
}
