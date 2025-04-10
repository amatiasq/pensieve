import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { Menu, MenuItem } from '@szhsin/react-menu';
import { ButtonHTMLAttributes, useCallback } from 'react';
import { copyToClipboard } from '../../0-dom/copyToClipboard.ts';
import { NoteId } from '../../2-entities/Note.ts';
import { ghPublicPage } from '../../3-github/gh-utils.ts';
import { useNavigator } from '../../6-hooks/useNavigator.ts';
import { useNote } from '../../6-hooks/useNote.ts';
import { useUsername } from '../../6-hooks/useUsername.ts';
import { IconButton } from '../atoms/IconButton.tsx';
import { ArrowIcon } from '../icons/ArrowIcon.tsx';
import { ClipboardIcon } from '../icons/ClipboardIcon.tsx';
import { GithubIcon } from '../icons/GithubIcon.tsx';
import { IconContainer } from '../icons/IconContainer.tsx';
import { MenuIcon } from '../icons/MenuIcon.tsx';
import { TrashIcon } from '../icons/TrashIcon.tsx';

const StyledIcon = styled(IconContainer)`
  transform: scale(0.8);
`;

const ArrowUp = styled(IconContainer)`
  transform: rotate(-90deg);
`;

const StyledMenu = styled(Menu)`
  --menu-gap: calc(--sidebar-gap * 2);

  ul {
    z-index: 10;
    border-radius: 5px;
    overflow: hidden;
    border: 1px solid var(--border-color);
    box-shadow: rgba(0, 0, 0, 0.35) 0px 5px 15px;
  }
`;

const StyledMenuItem = styled(MenuItem)`
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
  const [note, { remove, bump }] = useNote(id);

  const navigator = useNavigator();
  const username = useUsername();

  const handleMoveUp = useCallback(bump, [bump]);

  const copyUrlToClipboard = useCallback(
    () => copyToClipboard(navigator.toNote(note!)),
    [note],
  );

  const handleRemove = useCallback(() => {
    if (!confirm(`Delete ${note!.title}?`)) {
      return;
    }

    if (navigator.isNote(id)) {
      navigator.goRoot();
    }

    return remove();
  }, [navigator, note, remove]);

  if (!note) return null;

  const githubUrl = ghPublicPage(username, note);
  const button = <IconButton {...divProps} icon={<MenuIcon title="asdf" />} />;

  return (
    <StyledMenu menuButton={button}>
      <StyledMenuItem onClick={copyUrlToClipboard} css={realMenuItem}>
        <StyledIcon>
          <ClipboardIcon title="Copy to clipboard" />
        </StyledIcon>
        Copy to clipboard
      </StyledMenuItem>
      <StyledMenuItem onClick={handleMoveUp} css={realMenuItem}>
        <ArrowUp>
          <ArrowIcon title="Move up" />
        </ArrowUp>
        Move to top
      </StyledMenuItem>
      <StyledMenuItem>
        <a href={githubUrl} css={realMenuItem} target="_blank">
          <StyledIcon>
            <GithubIcon title="Open note in Github" />
          </StyledIcon>
          View in GitHub
        </a>
      </StyledMenuItem>
      <StyledMenuItem onClick={handleRemove} css={realMenuItem}>
        <StyledIcon>
          <TrashIcon title="Remove note" />
        </StyledIcon>
        Remove {note.title}
      </StyledMenuItem>
    </StyledMenu>
  );
}
