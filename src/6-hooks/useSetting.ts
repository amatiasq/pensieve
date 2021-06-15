import { useContext, useEffect, useState } from 'react';

import { DEFAULT_SETTINGS, Settings } from '../2-entities/Settings';
import { AppStorageContext } from '../5-app/contexts';
import { hookStore } from './helpers/hookStore';

const serialize = JSON.stringify;

const useSettings = hookStore<Settings, []>(
  DEFAULT_SETTINGS,
  () => (store, setValue) => {
    store.settings.get().then(setValue);
    return store.settings.onChange(setValue);
  },
);

export function useSetting<Key extends keyof Settings>(key: Key) {
  const store = useContext(AppStorageContext);
  const [settings] = useSettings();
  const value = settings[key];
  const [, setValue] = useState(value);

  // Connect `value` to react rendering loop with `setValue`
  useEffect(() => setValue(value), [serialize(value)]);

  return [value, set] as const;

  function set(newValue: Settings[Key]) {
    if (serialize(value) !== serialize(newValue)) {
      store.settings.set({ ...settings, [key]: newValue });
      setValue(newValue);
    }
  }
}
