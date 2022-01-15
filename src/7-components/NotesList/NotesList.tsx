import React, { useCallback, useState } from 'react';
import { Note } from '../../2-entities/Note';
import { useCreateNote } from '../../6-hooks/useCreateNote';
import { useFilteredNotes } from '../../6-hooks/useFilteredNotes';
import { useNoteList } from '../../6-hooks/useNoteList';
import { useSetting } from '../../6-hooks/useSetting';
import { useShortcut } from '../../6-hooks/useShortcut';
import StringComparer from '../../util/StringComparer';
import { IconButton } from '../atoms/IconButton';
import { Loader } from '../atoms/Loader';
import { PresenceDetector } from '../atoms/PresenceDetector';
import { Resizer } from '../atoms/Resizer';
import { FilterBox } from './FilterBox';
import { NoteGroup } from './NoteGroup';
import { NoteItem } from './NoteItem';
import './NotesList.scss';

const INITIAL_ITEMS_COUNT = 50;
const ITEMS_COUNT_INCREASE = 50;

export function NotesList() {
  const createNote = useCreateNote();

  const [itemsCount, setItemsCount] = useState(INITIAL_ITEMS_COUNT);
  const [list, loading] = useNoteList();
  const [filter, setFilter] = useState<StringComparer | null>(null);
  const filtered = useFilteredNotes(list, filter);

  const [isVisible, setIsVisible] = useSetting('sidebarVisible');
  const [size, setSize] = useSetting('sidebarWidth');

  useShortcut('newNote', createNote);
  useShortcut('hideSidebar', () => setIsVisible(!isVisible));

  const renderMoreItems = useCallback(() => {
    const newCount = itemsCount + ITEMS_COUNT_INCREASE;
    console.debug(`🚅 Loading ${ITEMS_COUNT_INCREASE} more items: ${newCount}`);
    setItemsCount(newCount);
  }, [itemsCount]);

  if (!isVisible) {
    return null;
  }

  const listProps = filter ? { 'data-filter': true } : {};

  return (
    <aside>
      <h4 className="filter">
        <FilterBox onChange={setFilter} />
        <IconButton icon="plus" onClick={createNote} />
      </h4>

      <div className="notes-list" {...listProps}>
        {loading ? <Loader /> : renderList()}
      </div>

      <Resizer size={size} onChange={setSize} />
    </aside>
  );

  function renderList() {
    const groups = new Map<string, Note[]>();

    const notes = [
      ...filtered.filter(x => x.favorite),
      ...filtered.filter(x => !x.favorite),
    ];

    const finalList = notes
      .map(x => {
        const { group } = x;
        if (!group) return x;

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
