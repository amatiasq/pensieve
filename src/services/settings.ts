import { ClientStorage } from '@amatiasq/client-storage';

import { GistId, UserName } from '../contracts/type-aliases';
import { tooltip } from '../dom/tooltip';
import { Gist } from '../model/Gist';
import { notifySettingsChanged, onGistChanged } from './cache-invalidation';
import { CommandName } from './commands';
import { createGist, fetchGist, removeGist, updateGist } from './github_api';

const DEFAULT_SHORTCUTS: Record<string, CommandName> = {
  'CTRL+TAB': 'goBack',
  'CTRL+SHIFT+TAB': 'goForward',

  'CMD+S': 'saveCurrentFile',
  'CMD+,': 'settings',
  'CMD+B': 'hideSidebar',
  'CMD+W': 'goHome',
  'CMD+N': 'createGist',
  'CMD+T': 'createFile',

  // 'CMD+ArrowRight': 'nextFile',
  // 'CMD+ArrowLeft': 'prevFile',

  'CTRL+S': 'saveCurrentFile',
  'CTRl+,': 'settings',
  'CTRL+B': 'hideSidebar',
  'CTRL+W': 'goHome',
  'CTRL+N': 'createGist',
  'CTRL+T': 'createFile',

  // 'ALT+CTRL+META+SHIFT+Space': () =>
  // 'ALT+CMD+CTRL+SHIFT+Space': () =>
};

const DEFAULT_SETTINGS = {
  autosave: 5,
  reloadIfAwayForSeconds: 5,
  renderIndentGuides: false,
  rulers: [],
  settingsGistRecreateThreshold: 50,
  shortcuts: DEFAULT_SHORTCUTS,
  sidebarVisible: true,
  sidebarWidth: 400,
  starred: [],
  tabSize: 2,
  username: '' as UserName,
  welcomeGist: 'd195304f7bb1b8d5f3e76392c4a6cd01' as GistId,
  wordWrap: true,
};

export type Settings = typeof DEFAULT_SETTINGS;

const storage = new ClientStorage<Partial<Settings>>('gists.settings', {
  version: 1,
  default: {},
});

const settings = () => storage.get()!;
const gist = settingsGist();

export const settingsGistId = gist.getId;
export const getSettingsGist = gist.info;
export const setTopGists = gist.topGists;

export function getSetting<Key extends keyof Settings>(key: Key) {
  const val = settings()[key] as Settings[Key];
  const def = DEFAULT_SETTINGS[key] as Settings[Key];

  if (val == null) {
    return def;
  }

  if (isPlainObject(val) && isPlainObject(def)) {
    return {
      ...(def as Record<string, any>),
      ...(val as Record<string, any>),
    };
  }

  return val;
}

export function setSetting<Key extends keyof Settings>(
  key: Key,
  value: Settings[Key],
) {
  storage.set({ ...settings(), [key]: value });
  gist.sync();
  notifySettingsChanged();
}

function settingsGist() {
  const settingsFile = 'better-gist--settings.json';
  const gistId = new ClientStorage<GistId>('gist.settings.id');
  const getId = () => gistId.get();
  let isOperating = false;

  onGistChanged(raw => {
    if (raw.id === getId()) {
      storage.set(read(new Gist(raw)) || DEFAULT_SETTINGS);
      notifySettingsChanged();
    }
  });

  sync();

  return {
    getId,
    info,
    sync,
    topGists,
    write,
  };

  function info() {
    const id = getId();
    return id ? { id, filename: settingsFile } : null;
  }

  function topGists(list: Gist[]) {
    if (!list.length) {
      return list;
    }

    const match = list.find(x => x.hasFile(settingsFile));

    if (match) {
      gistId.set(match.id);
    }

    const id = getId();
    const index = id ? list.findIndex(x => x.id === id) : -1;

    operate<unknown>(
      () => {
        if (!id) {
          return create(settings());
        }

        const threshold = getSetting('settingsGistRecreateThreshold');
        const shouldRecreate = index === -1 || index > threshold;

        if (shouldRecreate) {
          return sync().then(recreate);
        }
      },
      () => null,
    );

    return index === -1
      ? list
      : [...list.slice(0, index), ...list.slice(index + 1)];

    function recreate(value: Partial<Settings>) {
      return removeGist(id!).finally(() => create(value));
    }
  }

  function operate<T>(action: () => Promise<T> | T, ifBusy: () => T) {
    if (isOperating) {
      return Promise.resolve(ifBusy());
    }

    isOperating = true;
    return Promise.resolve(action()).finally(() => (isOperating = false));
  }

  function sync() {
    const id = getId();

    return operate(() => {
      if (!id) return Promise.resolve(settings());

      return getGist().then(gist => {
        if (!gist) {
          return Promise.resolve(settings());
        }

        const content = read(gist);
        const needsUpdate =
          !content ||
          (gist.updatedAt < storage.lastUpdated &&
            serialize(content) !== serialize(settings()));

        if (needsUpdate) {
          return write(settings());
        }

        storage.set(content!);
        return content!;
      });
    }, settings);
  }

  function read(gist: Gist) {
    const file = gist.getFileByName(settingsFile);
    return file && deserialize(file.content);
  }

  function write(value: Partial<Settings>) {
    const id = gistId.get();
    return Promise.resolve(
      id ? editGist(value).catch(() => create(value)) : create(value),
    ).then(() => value);
  }

  function create(value: Partial<Settings>) {
    return createGist(getGistContent(value)).then(gist => {
      gistId.set(gist.id);
      return gist;
    });
  }

  function getGist() {
    const id = getId();
    return Promise.resolve(id ? fetchGist(id) : create(settings())).then(
      raw => new Gist(raw),
      () => null,
    );
  }

  function editGist(value: Partial<Settings>) {
    return updateGist(gistId.get()!, getGistContent(value));
  }

  function getGistContent(value: Partial<Settings>) {
    return {
      description:
        'Gist created by https://gist.amatiasq.com to store settings',
      files: {
        [settingsFile]: { content: serialize(value) },
        ['defaults.json']: { content: serialize(DEFAULT_SETTINGS) },
      },
    };
  }
}

function serialize(value: Partial<Settings>) {
  return JSON.stringify(value, null, 2) + '\n';
}

function deserialize(content: string) {
  try {
    return JSON.parse(content) as Settings;
  } catch (error) {
    console.error(`Invalid settings JSON:`, content);
    tooltip(`Error in settings file: ${error.message}`);
    return null;
  }
}

function isPlainObject(target: unknown): target is Record<string, any> {
  if (target == null || Array.isArray(target) || typeof target !== 'object') {
    return false;
  }

  return Object.getPrototypeOf(target) === Object.prototype;
}
