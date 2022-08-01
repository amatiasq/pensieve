import styled from '@emotion/styled';
import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { NoteId } from '../../2-entities/Note';
import { useNavigator } from '../../6-hooks/useNavigator';
import { useNote } from '../../6-hooks/useNote';
import { useUsername } from '../../6-hooks/useUsername';
import { IconButton } from '../atoms/IconButton';
import { IconLink } from '../atoms/IconLink';
import { GithubIcon, TrashIcon } from '../atoms/icons';
import { FavoriteButton } from '../molecule/FavoriteButton';

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: var(--sidebar-gap);
`;

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
  // border-left: var(--status-line-width) solid var(--status-line-color);
  border-bottom: 1px solid transparent;
  background-color: var(--note-item-color);
  user-select: none;
  color: var(--fg-color);
  text-decoration: none;

  &:hover {
    background-color: var(--bg-color-hover);
  }

  &:not(:hover) {
    ${Actions} {
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

export function NoteItem({ id }: { id: NoteId }) {
  const navigator = useNavigator();
  const username = useUsername();
  const [note, { remove }] = useNote(id);
  const [active, setActive] = useState<boolean>(navigator.isNote(id));

  useEffect(() =>
    navigator.onNavigate(next => {
      const isNextActive = next.isNote(id);

      if (active || isNextActive) {
        setActive(isNextActive);
      }
    }),
  );

  const handleRemove = useCallback(
    (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      if (!confirm(`Delete ${note!.title}?`)) {
        return;
      }

      event.preventDefault();

      if (navigator.isNote(id)) {
        navigator.goRoot();
      }

      return remove();
    },
    [navigator, note, remove],
  );

  if (!note) return null;

  const githubUrl = `https://github.com/${username}/pensieve-data/blob/main/note/${note.id}`;

  return (
    <NoteItemContainer
      to={navigator.toNote(note)}
      className={`${active ? 'active' : ''} ${note.favorite ? 'favorite' : ''}`}
    >
      <FavoriteButton id={note.id} className="star" />
      <Title>{note.title}</Title>

      <Actions>
        <IconLink
          icon={<GithubIcon title="Open note in Github" />}
          href={githubUrl}
        />
        <IconButton
          icon={<TrashIcon title="Remove note" />}
          onClick={handleRemove}
        />
      </Actions>
    </NoteItemContainer>
  );
}
