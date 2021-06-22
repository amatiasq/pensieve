import './NotesList.scss';

import React, { useState } from 'react';

import { isMobile } from '../../0-dom/isMobile';
import { Note } from '../../2-entities/Note';
import { useNoteList } from '../../6-hooks/useNoteList';
import { useSetting } from '../../6-hooks/useSetting';
import { useShortcut } from '../../6-hooks/useShortcut';
import StringComparer from '../../util/StringComparer';
import { IconButton } from '../atoms/IconButton';
import { Loader } from '../atoms/Loader';
import { Resizer } from '../atoms/Resizer';
import { FilterBox } from './FilterBox';
import { NoteGroup } from './NoteGroup';
import { NoteItem } from './NoteItem';

export function NotesList() {
  const [list, { loading, createNote }] = useNoteList();
  const [filter, setFilter] = useState<StringComparer | null>(null);

  const [isVisible, setIsVisible] = useSetting('sidebarVisible');
  const [size, setSize] = useSetting('sidebarWidth');

  useShortcut('newNote', createNote);
  useShortcut('hideSidebar', () => setIsVisible(!isVisible));

  const extraProps = filter ? { 'data-filter': true } : {};

  return (
    <aside
      className={isMobile || isVisible ? '' : 'hidden'}
      style={{ width: size }}
    >
      <h4 className="filter">
        <FilterBox onChange={setFilter} />
        <IconButton icon="plus" onClick={createNote} />
      </h4>

      <div className="notes-list" {...extraProps}>
        {loading ? <Loader /> : renderList()}
      </div>

      <Resizer size={size} onChange={setSize} />
    </aside>
  );

  function renderList() {
    const groups = new Map<string, Note[]>();
    const filtered = filter ? applyFilter(list, filter) : list;

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
      .filter(Boolean) as Array<string | Note>;

    return finalList.map(note => {
      if (typeof note !== 'string') {
        return <NoteItem key={note.id} id={note.id} />;
      }

      const group = note;
      const list = groups.get(group)!;
      return <NoteGroup key={`group/${group}`} group={group} notes={list} />;
    });
  }
}

function applyFilter(list: Note[], comparer: StringComparer) {
  return list.filter(gist =>
    comparer.matchesAny([gist.id, gist.title, gist.group]),
  );
}
