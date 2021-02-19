import { useEffect, useState } from 'react';

import {
  getSetting,
  onSettingsChanged,
  setSetting,
  Settings
} from '../5-app/settings';

const serialize = JSON.stringify;

export function useSetting<Key extends keyof Settings>(key: Key) {
  const value = getSetting(key);
  const [, setValue] = useState(value);

  let isEditing = false;

  // Connect `value` to react rendering loop with `setValue`
  useEffect(() => setValue(value), [serialize(value)]);

  useEffect(() =>
    onSettingsChanged(() => {
      const incoming = getSetting(key);

      if (!isEditing && serialize(incoming) !== serialize(value)) {
        setValue(incoming);
      }
    }),
  );

  return [value, set] as const;

  function set(newValue: Settings[Key]) {
    if (serialize(value) === serialize(newValue)) {
      return;
    }

    isEditing = true;
    setSetting(key, newValue);
    setValue(newValue);
    isEditing = false;
  }
}
