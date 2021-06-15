import './NoteGroup.scss';

import React from 'react';

import { Note } from '../../2-entities/Note';
import { Icon } from '../atoms/Icon';
import { NoteItem } from './NoteItem';

const getGroupOpenId = (group: string) => `group-open:${group}`;
const isGroupOpen = (group: string) =>
  Boolean(localStorage[getGroupOpenId(group)]);

export function NoteGroup({ group, notes }: { group: string; notes: Note[] }) {
  const isOpen = isGroupOpen(group);

  return (
    <li>
      <details
        className="group"
        data-group={group}
        open={isOpen}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onClick={onGroupClicked as any}
      >
        <summary className="group-title">
          <Icon name="angle-right" className="icon-button group-caret" />
          <span className="group-name">{group}</span>
          <i className="counter">{notes.length}</i>
        </summary>
        <ul className="group-content">
          {notes.map(x => (
            <NoteItem key={x.id} note={x} />
          ))}
        </ul>
      </details>
    </li>
  );
}

function onGroupClicked(event: MouseEvent) {
  const target = event.currentTarget as HTMLDetailsElement;
  const isOpen = target.hasAttribute('open');
  const key = getGroupOpenId(target.dataset.group!);

  console.log(`${key}: ${!isOpen}`);

  if (isOpen) {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, 'true');
  }
}
