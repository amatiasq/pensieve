import styled from '@emotion/styled';
import { useCreateNote } from '../../6-hooks/useCreateNote';
import { useShortcut } from '../../6-hooks/useShortcut';
import StringComparer from '../../util/StringComparer';
import { IconButton } from '../atoms/IconButton';
import { PlusIcon } from '../atoms/icons';
import { FilterBox } from './FilterBox';

const Header = styled.h4`
  --sidebar-header-gap: calc(var(--sidebar-gap) * 2);

  display: flex;
  align-items: center;
  gap: var(--sidebar-header-gap);
  padding: 0 var(--sidebar-header-gap) 0 0;
`;

const NewNoteButton = styled(IconButton)`
  --size: 2.5rem;
`;

export interface SidebarHeaderProps {
  onFilterChange: (comparer: StringComparer | null) => void;
}

export function SidebarHeader({ onFilterChange }: SidebarHeaderProps) {
  const createNote = useCreateNote();

  useShortcut('newNote', createNote);

  return (
    <Header>
      <FilterBox onChange={onFilterChange} />
      <NewNoteButton
        icon={<PlusIcon title="Create note" />}
        onClick={createNote}
      />
    </Header>
  );
}
