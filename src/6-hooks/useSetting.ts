import { useContext, useEffect, useState } from 'react';

import { ClientStorage } from '@amatiasq/client-storage';

import {
  areSettingsIdentical,
  DEFAULT_SETTINGS,
  Settings
} from '../2-entities/Settings';
import { NotesStorageContext } from '../5-app/contexts';
import { serialize } from '../util/serialization';

const localCache = new ClientStorage<Settings | null>(
  'pensieve.settings-hook',
  { version: 1 },
);

localCache.get();

function useSettings() {
  const store = useContext(NotesStorageContext);
  const [loading, setLoading] = useState(true);
  const [value, setValue] = useState<Settings>(
    localCache.cache || DEFAULT_SETTINGS,
  );

  useEffect(() => {
    store.settings.get().then(initialize);
    return store.settings.onChange(initialize);
  }, []);

  return [value, set, { loading }] as const;

  function initialize(newValue: Settings) {
    if (!areSettingsIdentical(newValue, value)) {
      localCache.set(newValue);
      setValue(newValue);
    }

    if (loading) {
      setLoading(false);
    }
  }

  async function set(newValue: Settings) {
    if (areSettingsIdentical(newValue, value)) return;

    localCache.set(newValue);
    setLoading(true);
    setValue(newValue);
    await store.settings.set(newValue);
    setLoading(false);
  }
}

export function useSetting<Key extends keyof Settings>(key: Key) {
  const [settings, setSettings, loading] = useSettings();
  const value = settings[key];
  const [, setValue] = useState(value);

  // Connect `value` to react rendering loop with `setValue`
  useEffect(() => {
    setValue(value);

    const cssValue = typeof value !== 'boolean' ? value : value ? 1 : 0;
    document.documentElement.style.setProperty(
      `--setting-${key}`,
      `${cssValue}`,
    );
  }, [serialize(value)]);

  return [value, set, loading] as const;

  function set(newValue: Settings[Key]) {
    if (serialize(value) !== serialize(newValue)) {
      setSettings({ ...settings, [key]: newValue });
    }
  }
}
