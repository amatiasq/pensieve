import { useEffect, useState } from 'react';
import { createStore } from '../4-storage';
import { AppStorage } from '../4-storage/AppStorage';
import { useNavigator } from '../6-hooks/useNavigator';
import { Loader } from '../7-components/atoms/Loader';
import { NotesList } from '../7-components/NotesList/NotesList';
import './App.scss';
import { StorageContext } from './contexts';
import { Router } from './Router';
import { useGithubAuth } from './useGithubAuth';

export function App() {
  const [store, setStore] = useState<AppStorage>(null!);
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

  useEffect(() => {
    const abort = new AbortController();

    document.body.addEventListener(
      'click',
      (e: MouseEvent) =>
        handleLinkClick(e, e.target as HTMLAnchorElement, navigator.go),
      { capture: true, signal: abort.signal } as AddEventListenerOptions,
    );

    return () => abort.abort();
  }, [navigator.go]);

  if (!store) {
    return <Loader />;
  }

  return (
    <StorageContext.Provider value={store}>
      <div className={`app page-${pageName}`}>
        <NotesList />
        <main>
          <Router />
        </main>
      </div>
    </StorageContext.Provider>
  );
}

function handleLinkClick(
  e: MouseEvent,
  link: HTMLAnchorElement,
  go: (url: string) => unknown,
) {
  if (link.tagName !== 'A') {
    return;
  }

  const { href } = link.dataset;

  if (!href?.startsWith(location.origin)) {
    return;
  }

  e.preventDefault();
  e.stopImmediatePropagation();

  go(href.replace(location.origin, ''));
}
