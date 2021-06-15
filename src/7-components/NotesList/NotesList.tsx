import './NotesList.scss';

import React, { useContext, useState } from 'react';

import { isMobile } from '../../0-dom/isMobile';
import { Note } from '../../2-entities/Note';
import { AppStorageContext } from '../../5-app/contexts';
import { useNavigator } from '../../6-hooks/useNavigator';
import { useNotesList } from '../../6-hooks/useNoteList';
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
  const navigator = useNavigator();
  const [list, isListLoading] = useNotesList();

  const store = useContext(AppStorageContext);
  const [filter, setFilter] = useState<StringComparer | null>(null);

  const [isVisible, setIsVisible] = useSetting('sidebarVisible');
  const [size, setSize] = useSetting('sidebarWidth');

  useShortcut('newNote', createNote);
  useShortcut('hideSidebar', () => setIsVisible(!isVisible));

  return (
    <aside
      className={isMobile || isVisible ? '' : 'hidden'}
      style={{ width: size }}
    >
      <h4 className="filter">
        <FilterBox onChange={setFilter} />
        <IconButton icon="plus" onClick={createNote} />
      </h4>

      <div className="notes-list">
        {isListLoading ? <Loader /> : renderList()}
      </div>

      <Resizer size={size} onChange={setSize} />
    </aside>
  );

  async function createNote() {
    const note = await store.createNote();
    return navigator.goNote(note);
  }

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
        return <NoteItem key={note.id} note={note} />;
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
