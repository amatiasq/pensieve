import { ClientStorage } from '@amatiasq/client-storage';
import { useEffect, useRef, useState } from 'react';
import {
  areSettingsIdentical,
  DEFAULT_SETTINGS,
  Settings,
} from '../2-entities/Settings.ts';
import { serialize } from '../util/serialization.ts';
import { useStore } from './useStore.ts';

const localCache = new ClientStorage<Settings | null>(
  'pensieve.settings-hook',
  { version: 1 },
);

localCache.get();

function useSettings() {
  const store = useStore();
  const [loading, setLoading] = useState(true);
  const [value, setValue] = useState<Settings>(
    localCache.cache || DEFAULT_SETTINGS,
  );

  // El listener se suscribe una vez, así que no puede comparar contra el `value`
  // de aquel render: congelado en el primero, la vuelta de un cambio ida-y-vuelta
  // coincide con él y se descarta por «idéntica». Ctrl+B dos veces dejaba la
  // sidebar escondida para siempre.
  const latest = useRef(value);
  latest.current = value;

  useEffect(() => {
    store.settings.get().then(initialize);
    return store.settings.onChange(initialize);
  }, []);

  return [value, set, loading] as const;

  function initialize(newValue: Settings) {
    if (!areSettingsIdentical(newValue, latest.current)) {
      latest.current = newValue;
      localCache.set(newValue);
      setValue(newValue);
    }

    setLoading(false);
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
