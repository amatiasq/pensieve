import styled from '@emotion/styled';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { NoteId } from '../../2-entities/Note';
import { useNavigator } from '../../6-hooks/useNavigator';
import { useNote } from '../../6-hooks/useNote';
import { FavoriteButton } from './FavoriteButton';
import { NoteActions } from './NoteActions';

const Title = styled.h5`
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  line-height: 1.5em;
`;

const NoteItemContainer = styled(Link)`
  display: flex;
  align-items: center;
  cursor: pointer;
  gap: var(--sidebar-gap);
  padding: var(--sidebar-gap);
  font-weight: 500;
  border-left: var(--status-line-width) solid var(--status-line-color);
  border-bottom: 1px solid transparent;
  background-color: var(--note-item-color);
  user-select: none;
  color: var(--fg-color);
  text-decoration: none;

  &:hover {
    background-color: var(--bg-color-hover);
  }

  &:not(:hover) {
    .actions {
      display: none;
    }

    &:not(.favorite) .star {
      visibility: hidden;
    }
  }

  &.active {
    color: var(--fg-color-active);
    background-color: var(--bg-color-active);
  }
`;

export interface NoteItemProps {
  id: NoteId;
  className?: string;
}

export function NoteItem({ id, className = '' }: NoteItemProps) {
  const navigator = useNavigator();

  const [note] = useNote(id);
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

  return (
    <NoteItemContainer
      to={navigator.toNote(note)}
      className={`${className} ${active ? 'active' : ''} ${
        note.favorite ? 'favorite' : ''
      }`}
    >
      <FavoriteButton id={note.id} className="star" />
      <Title>{note.title}</Title>
      <NoteActions id={note.id} className="actions" />
    </NoteItemContainer>
  );
}
