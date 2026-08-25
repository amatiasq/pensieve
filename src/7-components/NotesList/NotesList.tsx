import styled from '@emotion/styled';
import React, { useCallback, useMemo, useState } from 'react';
import { Note } from '../../2-entities/Note.ts';
import type { Settings } from '../../2-entities/Settings.ts';
import { useFilteredNotes } from '../../6-hooks/useFilteredNotes.ts';
import { useNoteList } from '../../6-hooks/useNoteList.ts';
import { useSetting } from '../../6-hooks/useSetting.ts';
import { useShortcut } from '../../6-hooks/useShortcut.ts';
import type StringComparer from '../../util/StringComparer.ts';
import { Loader } from '../atoms/Loader.tsx';
import { PresenceDetector } from '../atoms/PresenceDetector.tsx';
import { hideScrollbar } from '../styles.ts';
import { NoteGroup } from './NoteGroup.tsx';
import { NoteItem } from './NoteItem.tsx';

const INITIAL_ITEMS_COUNT = 50;
const ITEMS_COUNT_INCREASE = 50;

const NotesListContainer = styled.aside`
  ${hideScrollbar};

  grid-area: list;
  background-color: var(--bg-color-sidebar);
  transition: width 0.5s ease-in-out;
  font-size: var(--sidebar-font-size);
  overflow-y: auto;

  &:empty {
    position: relative;

    &::after {
      position: absolute;
      display: flex;
      align-items: center;
      justify-content: center;
      content: 'Empty';
      opacity: 0.7;
      inset: 0;
    }
  }

  &[data-filter]:empty::after {
    content: 'No results';
  }

  &[data-scrolled] {
    box-shadow: rgba(0 0 0 / 0.16) 0px 3px 6px inset,
      rgba(0 0 0 / 0.23) 0px 3px 6px inset;
  }

  &__end {
    text-align: center;
    padding: 8em 1em;
  }
`;

export interface NotesListProps {
  filter: StringComparer | null;
}

export function NotesList({ filter }: NotesListProps) {
  const [list, loading] = useNoteList();
  const [itemsCount, setItemsCount] = useState(INITIAL_ITEMS_COUNT);

  const filtered = useFilteredNotes(list, filter);

  const [isVisible, setIsVisible] = useSetting('sidebarVisible');
  const [folders] = useSetting('folders');

  const unifyFolderName = useMemo(() => folderNameUnifier(folders), [folders]);

  useShortcut('hideSidebar', () => setIsVisible(!isVisible));

  const renderMoreItems = useCallback(() => {
    const newCount = itemsCount + ITEMS_COUNT_INCREASE;
    console.debug(`🚅 Loading ${ITEMS_COUNT_INCREASE} more items: ${newCount}`);
    setItemsCount(newCount);
  }, [itemsCount]);

  if (!isVisible && location.pathname !== '/') {
    return null;
  }

  const listProps = filter ? { 'data-filter': true } : {};

  return (
    <NotesListContainer {...listProps} onScroll={markScrolled}>
      {loading ? <Loader /> : renderList()}
    </NotesListContainer>
  );

  function renderList() {
    const rows = foldGroups(filtered, unifyFolderName);
    const toRender = rows.slice(0, itemsCount);
    console.debug(`🚅 Rendering ${toRender.length} of ${rows.length}`);

    return (
      <>
        {toRender.map(row =>
          'notes' in row ? (
            <NoteGroup
              key={`group/${row.group}`}
              group={row.group}
              notes={row.notes}
            />
          ) : (
            <NoteItem key={row.id} id={row.id} />
          ),
        )}
        <PresenceDetector
          className="notes-list__end"
          onVisible={renderMoreItems}
        >
          {itemsCount < rows.length ? (
            <Loader onClick={renderMoreItems} />
          ) : rows.length > 50 ? (
            'No more notes'
          ) : null}
        </PresenceDetector>
      </>
    );
  }
}

type ListRow = Note | { group: string; notes: Note[] };

// Las favoritas primero, y cada carpeta ocupa una sola fila: la de su primera
// nota. La fila se queda con el array que las siguientes siguen llenando, así
// que basta una pasada para que la carpeta salga completa y en su sitio.
function foldGroups(notes: Note[], unifyName: (group: string) => string) {
  const ordered = [
    ...notes.filter(x => x.favorite),
    ...notes.filter(x => !x.favorite),
  ];

  const byGroup = new Map<string, Note[]>();
  const rows: ListRow[] = [];

  for (const note of ordered) {
    if (!note.group) {
      rows.push(note);
      continue;
    }

    const group = unifyName(note.group);
    const collected = byGroup.get(group);

    if (collected) {
      collected.push(note);
      continue;
    }

    const first = [note];
    byGroup.set(group, first);
    rows.push({ group, notes: first });
  }

  return rows;
}

// Los settings mandan en cómo se escribe una carpeta: `todo` y `TODO` son la
// misma, y se pinta con las mayúsculas que el usuario le puso.
function folderNameUnifier(folders: Settings['folders']) {
  if (!folders) return (group: string) => group;

  const byLowercase = Object.fromEntries(
    Object.keys(folders).map(x => [x.toLocaleLowerCase(), x]),
  );

  return (group: string) => byLowercase[group.toLocaleLowerCase()] || group;
}

// A mano y no por estado: la sombra del borde no vale un render de la lista
// entera en cada scroll.
function markScrolled(event: React.UIEvent<HTMLElement>) {
  const target = event.currentTarget;
  target.toggleAttribute('data-scrolled', Boolean(target.scrollTop));
}
