import styled from '@emotion/styled';
import { createRef, useState } from 'react';
import { useScheduler } from '../../6-hooks/useScheduler';
import { useShortcut } from '../../6-hooks/useShortcut';
import StringComparer from '../../util/StringComparer';
import { IconButton } from '../atoms/IconButton';
import { CrossIcon, iconStyles, LoupeIcon } from '../atoms/icons';

const FormControl = styled.div`
  flex: 1;
  display: flex;
  background-color: var(--bg-color-control);
  color: var(--fg-color);
  padding: var(--spacing);
  border-right: 1px solid var(--border-color);

  &:focus-within {
    padding: calc(var(--spacing) - 1px);
    border: 1px solid var(--border-color-active);
  }
`;

const Input = styled.input`
  flex: 1;
  background-color: var(--bg-color-control);
  color: var(--fg-color);
  padding: var(--spacing);
`;

export function FilterBox({
  onChange,
}: {
  onChange: (comparer: StringComparer | null) => void;
}) {
  const ref = createRef<HTMLInputElement>();
  const [term, setTerm] = useState('');
  const scheduler = useScheduler(50, () =>
    onChange(term ? new StringComparer(term) : null),
  );

  useShortcut('clearFilter', () => process(''));

  return (
    <FormControl>
      <div css={iconStyles}>
        <LoupeIcon title="Filter" />
      </div>

      <Input
        ref={ref}
        className="filter-box"
        type="text"
        placeholder="Filter..."
        defaultValue={term}
        onChange={e => process(e.target.value)}
      />

      {term ? (
        <IconButton
          icon={<CrossIcon title="Clear filter" />}
          onClick={() => process('')}
        />
      ) : null}
    </FormControl>
  );

  function process(value: string) {
    if (ref.current) {
      ref.current.value = value;
    }

    setTerm(value);
    scheduler.restart();
  }
}
