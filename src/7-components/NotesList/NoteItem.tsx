import './NoteItem.scss';

import React, { useContext } from 'react';

import { AppStorageContext } from '../../5-app/contexts';
import { useTags } from '../../6-hooks/useTags';
import { Note } from '../../entities/Note';
import { Action } from '../atoms/Action';

export function NoteItem({ note }: { note: Note }) {
  const store = useContext(AppStorageContext);
  const tags = useTags().filter(x => x.notes.includes(note.id));
  const extraClasses = note.favorite ? 'starred' : '';

  return (
    <li className={`note-item ${extraClasses}`}>
      <div className="star-part">
        <Action
          name="gist-item--star"
          icon={note.favorite ? 'star' : 'far star'}
          onClick={() => store.toggleFavorite(note.id)}
        />
      </div>

      <div className="title-part">
        <h5>{note.title}</h5>
        <h6>{tags.map(x => x.name)}</h6>
      </div>
    </li>
  );
}
