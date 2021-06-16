import React, { createRef, useState } from 'react';

import { useScheduler } from '../../6-hooks/useScheduler';
import { useShortcut } from '../../6-hooks/useShortcut';
import StringComparer from '../../util/StringComparer';
import { IconButton } from '../atoms/IconButton';

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
    <>
      <input
        ref={ref}
        className="filter-box"
        type="text"
        placeholder="Filter..."
        defaultValue={term}
        onChange={e => process(e.target.value)}
      />

      {term ? <IconButton icon="times" onClick={() => process('')} /> : null}
    </>
  );

  function process(value: string) {
    if (ref.current) {
      ref.current.value = value;
    }

    setTerm(value);
    scheduler.restart();
  }
}
