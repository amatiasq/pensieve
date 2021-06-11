import './NotesList.scss';

import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';

import { isMobile } from '../../0-dom/isMobile';
import { registerCommand } from '../../1-core/commands';
import { Note } from '../../2-entities/Note';
import { useNotesList } from '../../6-hooks/useNoteList';
import { useSetting } from '../../6-hooks/useSetting';
import StringComparer from '../../util/StringComparer';
import { Action } from '../atoms/Action';
import { Resizer } from '../atoms/Resizer';
import { FilterBox } from './FilterBox';
import { NoteItem } from './NoteItem';

export function NotesList() {
  const [filter, setFilter] = useState<StringComparer | null>(null);

  const [isVisible, setIsVisible] = useSetting('sidebarVisible');
  const [size, setSize] = useSetting('sidebarWidth');

  const history = useHistory();
  const list = useNotesList();
  const filtered = filter ? applyFilter(list, filter) : list;

  registerCommand('newNote', () => history.push('/new'));
  registerCommand('hideSidebar', () => setIsVisible(!isVisible));

  return (
    <aside style={{ width: size, display: isMobile || isVisible ? '' : 'none' }}>
      <h4 className="filter">
        <FilterBox onChange={setFilter} />
        <Action name="new-note" icon="plus" navigate="/new" />
      </h4>

      <ul className="notes-list">
        {filtered.length ? (
          filtered.map(note => <NoteItem key={note.id} note={note} />)
        ) : filter ? (
          <li className="notes-list--empty">No Results</li>
        ) : (
          <li className="notes-list--empty">No notes</li>
        )}
      </ul>

      <Resizer size={size} onChange={setSize} />
    </aside>
  );
}

function applyFilter(list: Note[], comparer: StringComparer) {
  return list.filter(gist => comparer.matches(gist.title || ''));
}
