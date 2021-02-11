import { useState, useEffect } from 'react';

import { getSetting, setSetting, Settings } from '../services/settings';

export function useSetting<Key extends keyof Settings>(key: Key) {
  const value = getSetting(key) as Settings[Key];
  const [_, setValue] = useState(value);

  useEffect(() => {
    setValue(value);
  }, [value]);

  return [
    value,
    newValue => {
      if (value !== newValue) {
        setSetting(key, newValue);
        setValue(newValue);
      }
    },
  ] as [NonNullable<Settings[Key]>, (newValue: Settings[Key]) => void];
}
