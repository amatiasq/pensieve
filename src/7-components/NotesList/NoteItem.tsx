import styled from '@emotion/styled';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { NoteId } from '../../2-entities/Note';
import { useNavigator } from '../../6-hooks/useNavigator';
import { useNote } from '../../6-hooks/useNote';
import { ellipsis, hStack } from '../styles';
import { FavoriteButton } from './FavoriteButton';
import { NoteActions } from './NoteActions';

const StyledFavouriteButton = styled(FavoriteButton)``;

const StyledActions = styled(NoteActions)``;

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
    ${StyledActions} {
      display: none;
    }

    &:not(.favorite) ${StyledFavouriteButton} {
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
    className,
    active ? 'active' : '',
    note.favorite ? 'favorite' : '',
  ].join(' ');

  return (
    <NoteItemContainer className={cn}>
      <StyledFavouriteButton id={note.id} />
      <Title to={navigator.toNote(note)}>{note.title || '(untitled)'}</Title>
      <StyledActions id={note.id} />
    </NoteItemContainer>
  );
}
