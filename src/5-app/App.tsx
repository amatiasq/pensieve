import styled from '@emotion/styled';
import { useEffect, useState } from 'react';
import { desktopOnly, mobileOnly } from '../0-dom/responsive';
import { useNavigator } from '../6-hooks/useNavigator';
import { useSetting } from '../6-hooks/useSetting';
import { Resizer } from '../7-components/atoms/Resizer';
import { NotesList } from '../7-components/NotesList/NotesList';
import { SidebarHeader } from '../7-components/SidebarHeader/SidebarHeader';
import StringComparer from '../util/StringComparer';
import { Router } from './Router';

const GridResizer = styled(Resizer)`
  grid-area: resizer;
`;

const StyledAppContainer = styled.div`
  height: 100vh;
  width: 100vw;
  overflow: hidden;

  font-family: Arial, Helvetica, sans-serif;

  display: grid;
  align-items: stretch;
  align-content: stretch;
  justify-items: stretch;

  --header-height: calc(var(--note-item-height) * 1.3);
  grid-template-rows: var(--header-height) 1fr;

  > main {
    grid-area: editor;
    z-index: 1;
  }

  ${mobileOnly} {
    grid-template-columns: 100vw;

    ${GridResizer} {
      display: none;
    }

    &.page-home {
      grid-template-areas:
        'sidebar-header'
        'list';
    }

    &.page-settings {
      grid-template-areas:
        'settings-header'
        'editor';
    }

    &.page-note {
      grid-template-rows: minmax(0, 1fr);
      grid-template-areas:
        'editor'
        'editor';
    }
  }

  ${desktopOnly} {
    --sidebar-width: calc(
      calc(var(--setting-sidebarWidth, 400) * var(--setting-sidebarVisible)) *
        1px
    );

    grid-template-columns: var(--sidebar-width) 5px 1fr;

    grid-template-areas:
      'sidebar-header resizer editor'
      'list resizer editor';

    &.page-settings {
      grid-template-areas:
        'sidebar-header resizer settings-header'
        'list resizer editor';
    }
  }
`;

export function App() {
  const navigator = useNavigator();
  const [pageName, setPageName] = useState(navigator.getPageName());
  const [filter, setFilter] = useState<StringComparer | null>(null);
  const [size, setSize] = useSetting('sidebarWidth');

  useEffect(() =>
    navigator.onNavigate(next => setPageName(next.getPageName())),
  );

  useEffect(() => {
    const abort = new AbortController();

    document.body.addEventListener(
      'click',
      event =>
        handleLinkClick(event, event.target as HTMLAnchorElement, navigator.go),
      { capture: true, signal: abort.signal } as AddEventListenerOptions,
    );

    return () => abort.abort();
  }, [navigator.go]);

  return (
    <StyledAppContainer className={`page-${pageName}`}>
      <SidebarHeader onFilterChange={setFilter} />
      <NotesList filter={filter} />
      <GridResizer size={size} onChange={setSize} />
      <Router />
    </StyledAppContainer>
  );
}

function handleLinkClick(
  event: MouseEvent,
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

  event.preventDefault();
  event.stopImmediatePropagation();

  go(href.replace(location.origin, ''));
}
