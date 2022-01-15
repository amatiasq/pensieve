import React, { useEffect, useState } from 'react';
import { Note } from '../../2-entities/Note';
import { useNavigator } from '../../6-hooks/useNavigator';
import { Icon } from '../atoms/Icon';
import './NoteGroup.scss';
import { NoteItem } from './NoteItem';

const getGroupOpenId = (group: string) => `group-open:${group}`;
export const isGroupOpen = (group: string) =>
  Boolean(localStorage[getGroupOpenId(group)]);

export function NoteGroup({ group, notes }: { group: string; notes: Note[] }) {
  const hasActiveNote = (nav: ReturnType<typeof useNavigator>) =>
    notes.some(x => nav.isNote(x));

  const isOpen = isGroupOpen(group);
  const navigator = useNavigator();
  const [containsActiveNote, setContainsActiveNote] = useState(
    hasActiveNote(navigator),
  );

  useEffect(() =>
    navigator.onNavigate(next => {
      const willContainActiveNote = hasActiveNote(next);
      if (containsActiveNote !== willContainActiveNote) {
        setContainsActiveNote(willContainActiveNote);
      }
    }),
  );

  const favorites = notes.filter(x => x.favorite);

  const cn = [
    'group',
    containsActiveNote ? 'has-active' : '',
    favorites.length ? 'has-favorite' : '',
  ];

  return (
    <details className={cn.join(' ')} data-group={group} open={isOpen}>
      <summary className="group-title" onClick={onGroupClicked}>
        <Icon name="angle-right" className="icon-button group-caret" />
        <span className="group-name">{group}</span>
        {favorites.length ? (
          <>
            <i className="fav-counter">{favorites.length}</i> /
          </>
        ) : null}
        <i className="counter">{notes.length}</i>
      </summary>

      <ul className="group-content">
        {notes.map(x => (
          <NoteItem key={x.id} id={x.id} />
        ))}
      </ul>
    </details>
  );
}

function onGroupClicked(event: React.MouseEvent<HTMLElement, MouseEvent>) {
  const target = (event.currentTarget as HTMLElement)
    .parentElement as HTMLDetailsElement;

  const isOpen = target.hasAttribute('open');
  const key = getGroupOpenId(target.dataset.group!);

  console.debug(`> ${key}: ${!isOpen}`);

  if (isOpen) {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, 'true');
  }
}
