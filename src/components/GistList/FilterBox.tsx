import React, { createRef, useState } from 'react';

import { useScheduler } from '../../hooks/useScheduler';
import StringComparer from '../../util/StringComparer';
import { Action } from '../Action';

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

  return (
    <>
      <input
        ref={ref}
        type="text"
        placeholder="Filter..."
        defaultValue={term}
        onChange={e => process(e.target.value)}
      />

      {term ? (
        <Action name="clear" icon="times" onClick={() => process('')} />
      ) : null}
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
