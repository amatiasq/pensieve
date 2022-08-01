import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { useEffect, useState } from 'react';
import { Note } from '../../2-entities/Note';
import { useNavigator } from '../../6-hooks/useNavigator';
import { Disclosure, DisclosureToggleEvent } from '../molecule/Disclosure';
import { GroupCounter } from '../molecule/GroupCounter';
import { NoteItem } from './NoteItem';

const Title = styled.span`
  flex: 1;
`;

const Content = styled.ul`
  border-left: var(--group-border-width) solid var(--group-border-color);
  border-bottom: var(--group-border-width) solid var(--group-border-color);
`;

const NoteGroupItem = styled(NoteItem)`
  &:not(.active) {
    --status-line-width: 0;
  }

  &.active {
    margin-left: calc(var(--status-line-width) * -1);
    --status-line-color: var(--border-color-active);
  }
`;

const styles = css`
  --status-line-color: var(--group-color);

  &:hover summary {
    background-color: var(--bg-color-hover);
  }

  &.has-active-note summary {
    background-color: var(--group-active-color);
  }

  &[open] {
    summary {
      border-color: var(--group-border-color);
    }

    ${Content} {
      animation: details-show var(--animation-speed) ease-in-out;
    }

    & + & summary {
      border-top-width: 0;
    }
  }

  @keyframes details-show {
    from {
      opacity: 0;
      transform: var(--details-translate, translateY(-0.5em));
    }
  }
`;

const getGroupOpenId = (group: string) => `group-open:${group}`;
const isGroupOpen = (group: string) =>
  Boolean(localStorage[getGroupOpenId(group)]);

export function NoteGroup({ group, notes }: { group: string; notes: Note[] }) {
  const hasActiveNote = (nav: ReturnType<typeof useNavigator>) =>
    notes.some(x => nav.isNote(x));

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

  return (
    <Disclosure
      className={containsActiveNote ? 'has-active-note' : undefined}
      isOpen={isGroupOpen(group)}
      onToggle={onGroupClicked}
      css={styles}
    >
      <>
        <Title>{group}</Title>
        <GroupCounter items={notes.length} favorites={favorites.length} />
      </>

      <Content>
        {notes.map(x => (
          <NoteGroupItem key={x.id} id={x.id} />
        ))}
      </Content>
    </Disclosure>
  );
}

function onGroupClicked({ target, isOpen }: DisclosureToggleEvent) {
  const key = getGroupOpenId(target.dataset.group!);

  console.debug(`> ${key}: ${!isOpen}`);

  if (isOpen) {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, 'true');
  }
}
