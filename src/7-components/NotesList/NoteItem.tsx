import './NoteItem.scss';

import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { Note } from '../../2-entities/Note';
import { AppStorageContext } from '../../5-app/contexts';
import { useNavigator } from '../../6-hooks/useNavigator';
import { useTags } from '../../6-hooks/useTags';
import { IconButton } from '../atoms/IconButton';

export function NoteItem({ note }: { note: Note }) {
  const navigator = useNavigator();
  const store = useContext(AppStorageContext);
  const tags = useTags().filter(x => x.notes.includes(note.id));
  const [active, setActive] = useState(navigator.isNote(note));

  const cn = [
    'note-item',
    note.favorite ? 'favorite' : '',
    active ? 'active' : '',
  ];

  useEffect(() =>
    navigator.onNavigate(next => {
      const isNextActive = next.isNote(note);

      if (active || isNextActive) {
        setActive(isNextActive);
      }
    }),
  );

  return (
    <li className={cn.join(' ')}>
      <div className="star-part">
        <IconButton
          icon={note.favorite ? 'star' : 'far star'}
          onClick={() => store.toggleFavorite(note.id)}
        />
      </div>

      <Link className="title-part" to={navigator.toNote(note)}>
        <h5>{note.title}</h5>
        <h6>{tags.map(x => x.name)}</h6>
      </Link>

      <div className="actions-part">
        <IconButton icon="trash" onClick={() => store.deleteNote(note.id)} />
      </div>
    </li>
  );
}
