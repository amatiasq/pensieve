import { ClientStorage } from '@amatiasq/client-storage';

import { GistId } from '../contracts/type-aliases';
import { Gist } from '../model/Gist';
import {
  createGist,
  fetchGist,
  removeGist,
  setFileContent,
} from './github_api';

export interface Settings {
  autosave: number;
  reloadIfAwayForSeconds: number;
  rulers: number[];
  settingsGistRecreateThreshold: number;
  sidebarWidth: number;
  starred: string[];
  tabSize: number;
  wordWrap: boolean;
}

const DEFAULT = {
  sidebarWidth: 400,
  autosave: 5,
  reloadIfAwayForSeconds: 5,
  settingsGistRecreateThreshold: 50,
  tabSize: 2,
  wordWrap: true,
  rulers: [],
  starred: [],
} as Settings;

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
  const val = settings()[key];
  return (val == null ? DEFAULT[key] : val) as NonNullable<Settings[Key]>;
}

export function setSetting<Key extends keyof Settings>(
  key: Key,
  value: Settings[Key],
) {
  storage.set({ ...settings(), [key]: value });
  gist.sync();
}

function settingsGist() {
  const settingsFile = 'better-gist--settings.json';
  const gistId = new ClientStorage<GistId>('gist.settings.id');
  const getId = () => gistId.get();
  let isOperating = false;

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

    operate(
      (): Promise<unknown> => {
        if (!id) {
          return create(settings());
        }

        const threshold = getSetting('settingsGistRecreateThreshold');
        const shouldRecreate = index === -1 || index > threshold;

        if (shouldRecreate) {
          return sync().then(recreate);
        }

        return Promise.resolve();
      },
    );

    return index === -1
      ? list
      : [...list.slice(0, index), ...list.slice(index + 1)];

    function recreate(value: Partial<Settings>) {
      return removeGist(id!).finally(() => create(value));
    }
  }

  function operate<T>(action: () => Promise<T>) {
    if (isOperating) {
      return Promise.reject('Settings gist is busy');
    }

    isOperating = true;
    return action().finally(() => (isOperating = false));
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
    }).catch(() => settings());
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
    const content = serialize(value);

    return createGist({
      files: {
        [settingsFile]: { content },
        ['defaults.json']: { content: serialize(DEFAULT) },
      },
    }).then(gist => {
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
    const id = gistId.get()!;
    return setFileContent(id, settingsFile, serialize(value));
  }
}

function serialize(value: Partial<Settings>) {
  return JSON.stringify(value, null, 2) + '\n';
}

function deserialize(content: string) {
  try {
    return JSON.parse(content) as Settings;
  } catch (error) {
    return null;
  }
}
