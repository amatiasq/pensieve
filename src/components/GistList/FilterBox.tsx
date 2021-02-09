import React, { createRef, useState } from 'react';
import { useScheduler } from '../../hooks/useScheduler';
import StringComparer from '../../util/StringComparer';

export function FilterBox({
  onChange,
}: {
  onChange: (comparer: StringComparer | null) => void;
}) {
  const [term, setTerm] = useState('');
  const scheduler = useScheduler(50, () =>
    onChange(term ? new StringComparer(term) : null),
  );

  const ref = createRef<HTMLInputElement>();

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
        <button className="clear" onClick={() => process('')}>
          <i className="fas fa-times"></i>
        </button>
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
