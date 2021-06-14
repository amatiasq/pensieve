import './NotesList.scss';

import React, { useContext, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { isMobile } from '../../0-dom/isMobile';
import { registerCommand } from '../../1-core/commands';
import { Note } from '../../2-entities/Note';
import { AppStorageContext } from '../../5-app/contexts';
import { useNavigator } from '../../6-hooks/useNavigator';
import { useNotesList } from '../../6-hooks/useNoteList';
import { useSetting } from '../../6-hooks/useSetting';
import StringComparer from '../../util/StringComparer';
import { IconButton } from '../atoms/IconButton';
import { Resizer } from '../atoms/Resizer';
import { FilterBox } from './FilterBox';
import { NoteGroup } from './NoteGroup';
import { NoteItem } from './NoteItem';

export function NotesList() {
  const navigator = useNavigator();
  const history = useHistory();
  const list = useNotesList();

  const store = useContext(AppStorageContext);
  const [filter, setFilter] = useState<StringComparer | null>(null);

  const [isVisible, setIsVisible] = useSetting('sidebarVisible');
  const [size, setSize] = useSetting('sidebarWidth');

  const filtered = filter ? applyFilter(list, filter) : list;
  const notes = [
    ...filtered.filter(x => x.favorite),
    ...filtered.filter(x => !x.favorite),
  ];

  registerCommand('newNote', () => history.push('/new'));
  registerCommand('hideSidebar', () => setIsVisible(!isVisible));

  const groups = new Map<string, Note[]>();
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

  return (
    <aside
      style={{ width: size, display: isMobile || isVisible ? '' : 'none' }}
    >
      <h4 className="filter">
        <FilterBox onChange={setFilter} />
        <IconButton icon="plus" onClick={createNote} />
      </h4>

      <ul className="notes-list">
        {finalList.map(note => {
          if (typeof note !== 'string') {
            return <NoteItem key={note.id} note={note} />;
          }

          const group = note;
          const list = groups.get(group)!;
          return (
            <NoteGroup key={`group/${group}`} group={group} notes={list} />
          );
        })}
      </ul>

      <Resizer size={size} onChange={setSize} />
    </aside>
  );

  async function createNote() {
    const note = await store.createNote();
    return navigator.goNote(note);
  }
}

function applyFilter(list: Note[], comparer: StringComparer) {
  return list.filter(gist => comparer.matches(gist.title || ''));
}
