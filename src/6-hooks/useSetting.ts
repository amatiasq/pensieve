import { useContext, useEffect, useState } from 'react';

import { Settings } from '../2-entities/Settings';
import { AppStorageContext } from '../5-app/contexts';
import { DEFAULT_SETTINGS } from '../5-app/DEFAULT_SETTINGS';
import { hookStore } from './helpers/hookStore';

const serialize = JSON.stringify;

const useSettings = hookStore<Settings, []>(DEFAULT_SETTINGS, () => (store, setValue) => {
  store.getSettings().then(setValue);
  return store.onSettingsChange(setValue);
});

export function useSetting<Key extends keyof Settings>(key: Key) {
  const store = useContext(AppStorageContext);
  const settings = useSettings();
  const value = settings[key];
  const [, setValue] = useState(value);

  // Connect `value` to react rendering loop with `setValue`
  useEffect(() => setValue(value), [serialize(value)]);

  return [value, set] as const;

  function set(newValue: Settings[Key]) {
    if (serialize(value) !== serialize(newValue)) {
      store.setSettings({ ...settings, [key]: value });
    }
  }
}
