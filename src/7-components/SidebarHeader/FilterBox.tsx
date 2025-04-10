import styled from '@emotion/styled';
import { createRef, useCallback, useState } from 'react';
import { useScheduler } from '../../6-hooks/useScheduler.ts';
import { useShortcut } from '../../6-hooks/useShortcut.ts';
import StringComparer from '../../util/StringComparer.ts';
import { IconButton } from '../atoms/IconButton.tsx';
import { CrossIcon } from '../icons/CrossIcon.tsx';
import { IconContainer } from '../icons/IconContainer.tsx';
import { LoupeIcon } from '../icons/LoupeIcon.tsx';

const FormControl = styled.div`
  flex: 1;
  display: flex;
  background-color: var(--bg-color-control);
  color: var(--fg-color);
  margin: var(--sidebar-gap);
  padding: var(--sidebar-gap);
  margin-right: 0;
  border: 1px solid var(--border-color);

  &:focus-within {
    border: 1px solid var(--border-color-active);
  }
`;

const Input = styled.input`
  flex: 1;
  background-color: var(--bg-color-control);
  color: var(--fg-color);
`;

export interface FilterBoxProps {
  onChange: (comparer: StringComparer | null) => void;
}

export function FilterBox({ onChange }: FilterBoxProps) {
  const ref = createRef<HTMLInputElement>();
  const [term, setTerm] = useState('');
  const scheduler = useScheduler(50, () =>
    onChange(term ? new StringComparer(term) : null),
  );

  useShortcut('clearFilter', () => process(''));

  const process = useCallback(
    (value: string) => {
      if (ref.current) {
        ref.current.value = value;
      }

      setTerm(value);
      scheduler.restart();
    },
    [ref, scheduler],
  );

  const handleInputChange = useCallback(
    e => process(e.target.value),
    [process],
  );
  const handleClearButton = useCallback(() => process(''), [process]);

  return (
    <FormControl>
      <IconContainer>
        <LoupeIcon title="Filter" />
      </IconContainer>

      <Input
        ref={ref}
        className="filter-box"
        type="text"
        placeholder="Filter..."
        defaultValue={term}
        onInput={handleInputChange}
      />

      {term ? (
        <IconButton
          icon={<CrossIcon title="Clear filter" />}
          onClick={handleClearButton}
        />
      ) : null}
    </FormControl>
  );
}
