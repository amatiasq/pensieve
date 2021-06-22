import './NoteItem.scss';

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { NoteId } from '../../2-entities/Note';
import { useNavigator } from '../../6-hooks/useNavigator';
import { useNote } from '../../6-hooks/useNote';
import { IconButton } from '../atoms/IconButton';

export function NoteItem({ id }: { id: NoteId }) {
  const navigator = useNavigator();
  const [note, { toggleFavorite, remove }] = useNote(id);
  const [active, setActive] = useState<boolean>(navigator.isNote(id));

  useEffect(() =>
    navigator.onNavigate(next => {
      const isNextActive = next.isNote(id);

      if (active || isNextActive) {
        setActive(isNextActive);
      }
    }),
  );

  if (!note) return null;

  const cn = [
    'note-item',
    note.favorite ? 'favorite' : '',
    active ? 'active' : '',
  ];

  const extraProps = note.group ? { 'data-group': note.group } : {};

  return (
    <Link className={cn.join(' ')} {...extraProps} to={navigator.toNote(note)}>
      <div className="star-part">
        <IconButton
          icon={note.favorite ? 'star' : 'far star'}
          onClick={toggleFavorite}
        />
      </div>

      <h5 className="title-part">{note.title}</h5>

      <div className="actions-part">
        <IconButton icon="trash" onClick={trash} />
      </div>
    </Link>
  );

  function trash(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    event.preventDefault();

    if (navigator.isNote(id)) {
      navigator.goRoot();
    }

    return remove();
  }
}
