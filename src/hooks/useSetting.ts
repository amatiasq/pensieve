import { useEffect, useState } from 'react';

import { onSettingsChanged } from '../services/cache-invalidation';
import { getSetting, setSetting, Settings } from '../services/settings';

const serialize = JSON.stringify;

export function useSetting<Key extends keyof Settings>(key: Key) {
  const get = () => getSetting(key) as Settings[Key];
  const value = get();
  const [_, setValue] = useState(value);

  let isEditing = false;

  useEffect(() => {
    setValue(value);
  }, [serialize(value)]);

  useEffect(
    () =>
      onSettingsChanged(() => {
        const newValue = serialize(get());
        const existing = serialize(value);

        if (!isEditing && newValue !== existing) {
          setValue(get());
        }
      }) as () => void,
  );

  return [
    value,
    newValue => {
      if (value !== newValue) {
        isEditing = true;
        setSetting(key, newValue);
        setValue(newValue);
        isEditing = false;
      }
    },
  ] as [NonNullable<Settings[Key]>, (newValue: Settings[Key]) => void];
}
