/* eslint-disable @typescript-eslint/no-explicit-any */
import { ClientStorage } from '@amatiasq/client-storage';

import { messageBus } from '../1-core/messageBus';
import { UserName } from '../2-github/type-aliases';
import { DEFAULT_SETTINGS } from './DEFAULT_SETTINGS';
import { settingsGist } from './settingsGist';

export type Settings = typeof DEFAULT_SETTINGS;

export interface Memory {
  username?: UserName;
}

const settings = new ClientStorage<Partial<Settings>>('bg.settings', {
  version: 1,
  default: {},
});

const memory = new ClientStorage<Memory>('bg.memory', {
  version: 1,
  default: {},
});

const [notifySettingsChanged, onSettingsChanged] = messageBus(
  'SETTINGS_CHANGED',
);

export { onSettingsChanged };

const gist = settingsGist(
  DEFAULT_SETTINGS,
  settings,
  memory,
  notifySettingsChanged,
);

gist.sync();

export const getSettingsGistPath = gist.path;
export const removeSettingsGistFrom = gist.removeFrom;

export function getFromMemory<Key extends keyof Memory>(
  key: Key,
  def: Memory[Key] | null = null,
) {
  return key in memory.cache ? memory.cache[key] : def;
}

export function saveToMemory<Key extends keyof Memory>(
  key: Key,
  value: Memory[Key],
) {
  memory.set({
    ...memory.cache,
    [key]: value,
  });

  gist.sync();
  notifySettingsChanged();
}

export function getSetting<Key extends keyof Settings>(
  key: Key,
): Settings[Key] {
  const def = DEFAULT_SETTINGS[key];

  if (!(key in settings.cache)) {
    return def;
  }

  const val = settings.cache[key];

  if (isPlainObject(val) && isPlainObject(def)) {
    return { ...(def as any), ...(val as any) } as Settings[Key];
  }

  return val as Settings[Key];
}

export function setSetting<Key extends keyof Settings>(
  key: Key,
  value: Settings[Key],
) {
  settings.set({
    ...settings.cache,
    [key]: value,
  });

  gist.sync();
  notifySettingsChanged();
}

function isPlainObject(target: unknown): target is Record<string, any> {
  if (target == null || Array.isArray(target) || typeof target !== 'object') {
    return false;
  }

  return Object.getPrototypeOf(target) === Object.prototype;
}
