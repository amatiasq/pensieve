import { Global } from '@emotion/react';
import { useEffect, useState } from 'react';
import { render } from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { createStore } from '../4-storage';
import { AppStorage } from '../4-storage/AppStorage';
import { Loader } from '../7-components/atoms/Loader';
import { App } from './App';
import { StorageContext } from './contexts';
import { globalStyles } from './theme';
import { useGithubAuth } from './useGithubAuth';

export function renderApp(container: HTMLElement): void {
  render(<Scaffold />, container);
}

function Scaffold() {
  const [store, setStore] = useState<AppStorage>(null!);
  const { token, username } = useGithubAuth();

  useEffect(() => {
    if (!token || !username) return;
    createStore(token, username, 'pensieve-data').then(setStore);
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
