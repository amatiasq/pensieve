/* eslint-disable @typescript-eslint/no-explicit-any */
import { ClientStorage } from '@amatiasq/client-storage';

import { messageBus } from '../1-core/messageBus';
import { GistId, UserName } from '../2-github/type-aliases';
import { settingsGist } from './settingsGist';
import { DEFAULT_SHORTCUTS } from './shortcuts';

const DEFAULT_SETTINGS = {
  autosave: 5,
  reloadIfAwayForSeconds: 5,
  renderIndentGuides: false,
  rulers: [],
  settingsGistRecreateThreshold: 50,
  shortcuts: DEFAULT_SHORTCUTS,
  sidebarVisible: true,
  sidebarWidth: 400,
  tabSize: 2,
  welcomeGist: 'd195304f7bb1b8d5f3e76392c4a6cd01' as GistId,
  wordWrap: true,
};

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

export function getSetting<Key extends keyof Settings>(key: Key) {
  const val = settings.cache[key];
  const def = DEFAULT_SETTINGS[key];

  if (val == null) {
    return def;
  }

  if (isPlainObject(val) && isPlainObject(def)) {
    return { ...(def as any), ...(val as any) } as Settings[Key];
  }

  return (val || def) as Settings[Key];
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
