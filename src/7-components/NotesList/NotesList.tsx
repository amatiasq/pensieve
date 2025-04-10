import styled from '@emotion/styled';
import React, { useCallback, useMemo, useState } from 'react';
import { Note } from '../../2-entities/Note.ts';
import { useFilteredNotes } from '../../6-hooks/useFilteredNotes.ts';
import { useNoteList } from '../../6-hooks/useNoteList.ts';
import { useSetting } from '../../6-hooks/useSetting.ts';
import { useShortcut } from '../../6-hooks/useShortcut.ts';
import StringComparer from '../../util/StringComparer.ts';
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

  const getUnifiedFolderName = useMemo(() => {
    if (!folders) return (group: string) => group;

    const folderKeys = Object.fromEntries(
      Object.keys(folders).map(x => [x.toLocaleLowerCase(), x]),
    );

    return (group: string) => folderKeys[group.toLocaleLowerCase()] || group;
  }, [folders]);

  useShortcut('hideSidebar', () => setIsVisible(!isVisible));

  const handleScroll = useCallback((event: React.UIEvent<HTMLElement>) => {
    const target = event.currentTarget;
    const isScrolledNow = Boolean(target.scrollTop);
    const wasScrolled = target.hasAttribute('data-scrolled');

    if (isScrolledNow !== wasScrolled) {
      if (isScrolledNow) {
        target.setAttribute('data-scrolled', 'true');
      } else {
        target.removeAttribute('data-scrolled');
      }
    }
  }, []);

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
    <NotesListContainer {...listProps} onScroll={handleScroll}>
      {loading ? <Loader /> : renderList()}
    </NotesListContainer>
  );

  function renderList() {
    const groups = new Map<string, Note[]>();

    const notes = [
      ...filtered.filter(x => x.favorite),
      ...filtered.filter(x => !x.favorite),
    ];

    const finalList = notes
      .map(x => {
        if (!x.group) return x;

        const group = getUnifiedFolderName(x.group);

        if (groups.has(group)) {
          groups.get(group)?.push(x);
          return null;
        }

        groups.set(group, [x]);
        return group;
      })
      .filter((x): x is string | Note => Boolean(x));

    const toRender = finalList.slice(0, itemsCount);
    const finalElement = finalList.length > 50 ? 'No more notes' : null;
    console.debug(`🚅 Rendering ${toRender.length} of ${finalList.length}`);

    return (
      <>
        {toRender.map(note => {
          if (typeof note !== 'string') {
            return <NoteItem key={note.id} id={note.id} />;
          }

          const group = note;
          const list = groups.get(group)!;
          return (
            <NoteGroup key={`group/${group}`} group={group} notes={list} />
          );
        })}
        <PresenceDetector
          className="notes-list__end"
          onVisible={renderMoreItems}
        >
          {itemsCount < finalList.length ? (
            <Loader onClick={renderMoreItems} />
          ) : (
            finalElement
          )}
        </PresenceDetector>
      </>
    );
  }
}
