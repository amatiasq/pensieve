import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { NoteId } from '../../2-entities/Note.ts';
import { useNavigator } from '../../6-hooks/useNavigator.ts';
import { useNote } from '../../6-hooks/useNote.ts';
import { ellipsis, hStack } from '../styles.ts';
import { FavoriteButton } from './FavoriteButton.tsx';
import { NoteActions } from './NoteActions.tsx';

const NoteItemContainer = styled.h5`
  ${hStack};
  --gap: var(--sidebar-gap);

  height: var(--note-item-height);
  cursor: pointer;
  user-select: none;
  border-left: var(--status-line-width) solid var(--status-line-color);

  &:hover {
    background-color: var(--bg-color-hover);
  }

  &:not(:hover) {
    .note-actions {
      display: none;
    }

    &:not(.favorite) .favorite-button {
      visibility: hidden;
    }
  }

  &.active {
    color: var(--fg-color-active);
    background-color: var(--bg-color-active);
  }
`;

const Title = styled(Link)`
  ${ellipsis};
  flex: 1;
  font-weight: 500;
  color: var(--fg-color);
  text-decoration: none;
  line-height: var(--note-item-height);
`;

export interface NoteItemProps {
  id: NoteId;
  className?: string;
}

export function NoteItem({ id, className = '' }: NoteItemProps) {
  const navigator = useNavigator();

  const [note] = useNote(id);
  const active = navigator.isNote(id);

  if (!note) return null;

  const cn = [
    className,
    active ? 'active' : '',
    note.favorite ? 'favorite' : '',
  ].join(' ');

  return (
    <NoteItemContainer className={cn}>
      <FavoriteButton className="favorite-button" id={note.id} />
      <Title to={navigator.toNote(note)}>{note.title || '(untitled)'}</Title>
      <NoteActions className="note-actions" id={note.id} />
    </NoteItemContainer>
  );
}
