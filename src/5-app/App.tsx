import styled from '@emotion/styled';
import { useEffect, useState } from 'react';
import { desktopOnly, mobileOnly } from '../0-dom/responsive.ts';
import { useNavigator } from '../6-hooks/useNavigator.ts';
import { useSetting } from '../6-hooks/useSetting.ts';
import { Resizer } from '../7-components/atoms/Resizer.tsx';
import { NotesList } from '../7-components/NotesList/NotesList.tsx';
import { SidebarHeader } from '../7-components/SidebarHeader/SidebarHeader.tsx';
import type StringComparer from '../util/StringComparer.ts';
import { Router } from './Router.tsx';

import { VALID_ORIGINS } from '../config.json' with { type: 'json' };

const validOrigins = location.origin.includes('localhost')
  ? [location.origin, ...VALID_ORIGINS]
  : VALID_ORIGINS;

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

  if (!href) {
    return;
  }

  const match = validOrigins.find(x => href.startsWith(x));

  if (!match) {
    return;
  }

  event.preventDefault();
  event.stopImmediatePropagation();

  go(href.replace(match, ''));
}
