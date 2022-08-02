import { Global } from '@emotion/react';
import styled from '@emotion/styled';
import { useEffect, useState } from 'react';
import { desktopOnly, mobileOnly } from '../0-dom/responsive';
import { createStore } from '../4-storage';
import { AppStorage } from '../4-storage/AppStorage';
import { useNavigator } from '../6-hooks/useNavigator';
import { Loader } from '../7-components/atoms/Loader';
import { NotesList } from '../7-components/NotesList/NotesList';
import { StorageContext } from './contexts';
import { Router } from './Router';
import { globalStyles } from './theme';
import { useGithubAuth } from './useGithubAuth';

const StyledAppContainer = styled.div`
  height: 100vh;
  width: 100vw;
  overflow: hidden;

  font-family: Arial, Helvetica, sans-serif;

  display: grid;
  align-items: stretch;
  align-content: stretch;
  justify-items: stretch;
  grid-template-rows: minmax(0, 1fr);

  --gist-item-height: 28px;

  > main {
    grid-area: editor;
    z-index: 1;
  }

  ${mobileOnly} {
    grid-template-columns: 100vw;

    &.page-home {
      grid-template-areas: 'list';
    }

    &.page-note {
      grid-template-areas: 'editor';

      > aside {
        display: none;
      }
    }
  }

  ${desktopOnly} {
    &:not(.page-home) {
      --sidebar-width: calc(
        calc(var(--setting-sidebarWidth, 400) * var(--setting-sidebarVisible)) *
          1px
      );
    }

    grid-template-columns: var(--sidebar-width) 1fr;
    grid-template-areas: 'list editor';
  }
`;

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
      <Global styles={globalStyles} />
      <StyledAppContainer className={`page-${pageName}`}>
        <NotesList />
        <main>
          <Router />
        </main>
      </StyledAppContainer>
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
