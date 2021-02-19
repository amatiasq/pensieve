import { useEffect, useState } from 'react';

import {
  getFromMemory,
  Memory,
  onSettingsChanged,
  saveToMemory
} from '../5-app/settings';

const serialize = JSON.stringify;

export function useMemory<Key extends keyof Memory>(key: Key) {
  const value = getFromMemory(key);
  const [, setValue] = useState(value);

  let isEditing = false;

  // Connect `value` to react rendering loop with `setValue`
  useEffect(() => setValue(value), [serialize(value)]);

  useEffect(() =>
    onSettingsChanged(() => {
      const incoming = getFromMemory(key);

      if (!isEditing && serialize(incoming) !== serialize(value)) {
        setValue(incoming);
      }
    }),
  );

  return [value, set] as const;

  function set(newValue: Memory[Key]) {
    if (serialize(value) === serialize(newValue)) {
      return;
    }

    isEditing = true;
    saveToMemory(key, newValue);
    setValue(newValue);
    isEditing = false;
  }
}
