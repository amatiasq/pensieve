import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { NoteId } from '../../2-entities/Note';
import { useNavigator } from '../../6-hooks/useNavigator';
import { useNote } from '../../6-hooks/useNote';
import { useUsername } from '../../6-hooks/useUsername';
import { IconButton } from '../atoms/IconButton';
import './NoteItem.scss';

export function NoteItem({ id }: { id: NoteId }) {
  const navigator = useNavigator();
  const username = useUsername();
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

  const githubUrl = `https://github.com/${username}/pensieve-data/blob/main/note/${note.id}`;

  const cn = [
    'note-item',
    note.favorite ? 'favorite' : '',
    active ? 'active' : '',
  ];

  const extraProps = note.group ? { 'data-group': note.group } : {};

  const ghLink = (
    <a
      target="_blank"
      href={githubUrl}
      onClick={event => event.stopPropagation()}
    >
      GH
    </a>
  );

  return (
    <Link className={cn.join(' ')} {...extraProps} to={navigator.toNote(note)}>
      <div className="star-part">
        <IconButton
          icon={note.favorite ? 'star' : 'far star'}
          onClick={applyFavorite}
        />
      </div>

      <h5 className="title-part">{note.title}</h5>

      <div className="actions-part">
        {ghLink}
        <IconButton icon="trash" onClick={applyRemove} />
      </div>
    </Link>
  );

  type ClickEvent = React.MouseEvent<HTMLButtonElement, MouseEvent>;

  function applyRemove(event: ClickEvent) {
    if (!confirm(`Delete ${note!.title}?`)) {
      return;
    }

    event.preventDefault();

    if (navigator.isNote(id)) {
      navigator.goRoot();
    }

    return remove();
  }

  function applyFavorite(event: ClickEvent) {
    event.preventDefault();
    toggleFavorite();
  }
}
