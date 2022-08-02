import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { Menu, MenuItem } from '@szhsin/react-menu';
import { ButtonHTMLAttributes, useCallback } from 'react';
import { NoteId } from '../../2-entities/Note';
import { useNavigator } from '../../6-hooks/useNavigator';
import { useNote } from '../../6-hooks/useNote';
import { useUsername } from '../../6-hooks/useUsername';
import { IconButton } from '../atoms/IconButton';
import { GithubIcon, iconStyles, MenuIcon, TrashIcon } from '../atoms/icons';

const IconContainer = styled.div`
  ${iconStyles}
`;

const Menu2 = styled(Menu)`
  --menu-gap: calc(--sidebar-gap * 2);

  ul {
    border-radius: 5px;
    overflow: hidden;
    border: 1px solid var(--border-color);
  }
`;

const MenuItem2 = styled(MenuItem)`
  background-color: var(--bg-color-control);
  border-bottom: 1px solid var(--border-color);

  &:hover {
    background-color: var(--note-item-color);
  }

  &:last-of-type {
    border-bottom: none;
  }

  a {
    text-decoration: none;
    color: inherit;
    font-size: inherit;
  }
`;

const realMenuItem = css`
  display: flex;
  align-items: center;
  cursor: pointer;
  gap: 1rem;
  padding: 1rem;
  user-select: none;
  white-space: nowrap;
`;

export interface NoteActionsProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  id: NoteId;
}

export function NoteActions({ id, ...divProps }: NoteActionsProps) {
  const [note, { remove }] = useNote(id);

  const navigator = useNavigator();
  const username = useUsername();

  const handleRemove = useCallback(() => {
    if (!confirm(`Delete ${note!.title}?`)) {
      return;
    }

    // event.preventDefault();

    if (navigator.isNote(id)) {
      navigator.goRoot();
    }

    return remove();
  }, [navigator, note, remove]);

  if (!note) return null;

  const githubUrl = `https://github.com/${username}/pensieve-data/blob/main/note/${note.id}`;
  const button = <IconButton {...divProps} icon={<MenuIcon title="asdf" />} />;

  return (
    <Menu2 menuButton={button}>
      <MenuItem2>
        <a href={githubUrl} css={realMenuItem} target="_blank">
          <IconContainer>
            <GithubIcon title="Open note in Github" />
          </IconContainer>
          View in GitHub
        </a>
      </MenuItem2>
      <MenuItem2 onClick={handleRemove} css={realMenuItem}>
        <IconContainer>
          <TrashIcon title="Remove note" />
        </IconContainer>
        Remove {note.title}
      </MenuItem2>
    </Menu2>
  );
}
