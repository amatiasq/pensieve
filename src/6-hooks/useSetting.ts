import { useContext, useEffect, useState } from 'react';

import { DEFAULT_SETTINGS, Settings } from '../2-entities/Settings';
import { AppStorageContext } from '../5-app/contexts';
import { deserialize, serialize } from '../util/serialization';
import { hookStore } from './helpers/hookStore';

const useSettings = hookStore<Settings, []>(
  DEFAULT_SETTINGS,
  () => (store, setValue) => {
    store.settings.read().then(x => setValue(deserialize(x)));
    return store.settings.onChange(x => setValue(deserialize(x)));
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
    if (value !== newValue) {
      store.settings.write(serialize({ ...settings, [key]: newValue }));
      setValue(newValue);
    }
  }
}
