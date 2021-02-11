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
  sidebarWidth: number;
  autosave: number;
  reloadIfAwayForSeconds: number;
  rulers: number[];
  starred: string[];
}

const DEFAULT = {
  sidebarWidth: 400,
  autosave: 5,
  reloadIfAwayForSeconds: 5,
  rulers: [],
  starred: [],
} as Settings;

const storage = new ClientStorage<Settings>('gists.settings', {
  default: DEFAULT,
});

const gist = settingsGist();
const settings = () => storage.get()!;

export const settingsGistId = () => gist.getId();
export const setTopGists = (list: Gist[]) => gist.topGists(list);

export function getSetting<Key extends keyof Settings>(key: Key) {
  const val = settings()[key];
  return val == null ? DEFAULT[key] : val;
}

export function setSetting<Key extends keyof Settings>(
  key: Key,
  value: Settings[Key],
) {
  storage.set({ ...settings(), [key]: value });
  gist.sync();
}

function settingsGist() {
  const RECREATE_THRESHOLD = 20;
  const FILENAME = 'better-gist--settings.json';
  const gistId = new ClientStorage<GistId>('gist.settings.id');
  const getId = () => gistId.get();
  let isOperating = false;

  sync();

  return {
    getId,
    write,
    sync,
    topGists,
  };

  function topGists(list: Gist[]) {
    const id = getId();
    const index = id
      ? list.findIndex(x => x.id === id || x.hasFile(FILENAME))
      : -1;

    operate(
      (): Promise<unknown> => {
        if (!id) {
          return create(settings());
        }

        if (index === -1 || index > RECREATE_THRESHOLD) {
          return sync().then(recreate);
        }

        return Promise.resolve();
      },
    );

    return index === -1
      ? list
      : [...list.slice(0, index), ...list.slice(index + 1)];

    function recreate(value: Settings) {
      return removeGist(id!).then(() => create(value));
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
      if (!id) return useStorage();

      return getGist().then(gist => {
        if (!gist || gist.updatedAt < storage.lastUpdated) {
          return useStorage();
        }

        const content = read(gist);

        if (!content) {
          return useStorage();
        }

        storage.set(content);
        return content;
      });
    }).catch(() => settings());

    function useStorage() {
      const stored = settings();
      return write(stored).then(() => stored);
    }
  }

  function read(gist: Gist) {
    const file = gist.getFileByName(FILENAME);
    return file && deserialize(file.content);
  }

  function write(value: Settings) {
    const id = gistId.get();

    if (id) {
      return editGist(value).catch(() => create(value));
    } else {
      return create(value);
    }
  }

  function create(value: Settings) {
    const content = serialize(value);

    return createGist({ files: { [FILENAME]: { content } } }).then(gist => {
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

  function editGist(value: Settings) {
    const id = gistId.get()!;
    return setFileContent(id, FILENAME, serialize(value));
  }
}

function serialize(value: Settings) {
  return JSON.stringify(value, null, 2);
}

function deserialize(content: string) {
  try {
    return JSON.parse(content) as Settings;
  } catch (error) {
    return null;
  }
}
