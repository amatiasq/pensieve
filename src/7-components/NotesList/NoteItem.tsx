import './NoteItem.scss';

import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { Note } from '../../2-entities/Note';
import { AppStorageContext } from '../../5-app/contexts';
import { useNavigator } from '../../6-hooks/useNavigator';
import { IconButton } from '../atoms/IconButton';

export function NoteItem({ note }: { note: Note }) {
  const navigator = useNavigator();
  const store = useContext(AppStorageContext);
  const [title, setTitle] = useState(note.title);
  const [active, setActive] = useState(navigator.isNote(note));

  const cn = [
    'note-item',
    note.favorite ? 'favorite' : '',
    active ? 'active' : '',
  ];

  useEffect(() => {
    const sus = store.onNoteTitleChanged(note.id).subscribe(setTitle);
    return () => sus.unsubscribe();
  });

  useEffect(() => {
    if (title !== note.title) {
      setTitle(note.title);
    }
  }, [note.title]);

  useEffect(() =>
    navigator.onNavigate(next => {
      const isNextActive = next.isNote(note);

      if (active || isNextActive) {
        setActive(isNextActive);
      }
    }),
  );

  const extraProps = note.group ? { 'data-group': note.group } : {};

  return (
    <Link className={cn.join(' ')} {...extraProps} to={navigator.toNote(note)}>
      <div className="star-part">
        <IconButton
          icon={note.favorite ? 'star' : 'far star'}
          onClick={() => store.toggleFavorite(note.id)}
        />
      </div>

      <h5 className="title-part">{title}</h5>

      <div className="actions-part">
        <IconButton icon="trash" onClick={remove} />
      </div>
    </Link>
  );

  function remove(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    event.preventDefault();

    if (navigator.isNote(note)) {
      navigator.goRoot();
    }

    return store.deleteNote(note.id);
  }
}
