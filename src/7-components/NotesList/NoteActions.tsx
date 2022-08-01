import styled from '@emotion/styled';
import { HTMLAttributes, useCallback } from 'react';
import { NoteId } from '../../2-entities/Note';
import { useNavigator } from '../../6-hooks/useNavigator';
import { useNote } from '../../6-hooks/useNote';
import { useUsername } from '../../6-hooks/useUsername';
import { IconButton } from '../atoms/IconButton';
import { IconLink } from '../atoms/IconLink';
import { GithubIcon, TrashIcon } from '../atoms/icons';

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: var(--sidebar-gap);
`;

export interface NoteActionsProps extends HTMLAttributes<HTMLDivElement> {
  id: NoteId;
}

export function NoteActions({ id, ...divProps }: NoteActionsProps) {
  const [note, { remove }] = useNote(id);

  const navigator = useNavigator();
  const username = useUsername();
  const githubUrl = `https://github.com/${username}/pensieve-data/blob/main/note/${note.id}`;

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

  return (
    <Actions {...divProps}>
      <IconLink
        icon={<GithubIcon title="Open note in Github" />}
        href={githubUrl}
      />
      <IconButton
        icon={<TrashIcon title="Remove note" />}
        onClick={handleRemove}
      />
    </Actions>
  );
}
