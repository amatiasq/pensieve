import { ClientStorage } from '@amatiasq/client-storage';

import {
  createGist,
  onGistChanged,
  removeGist,
  updateGist
} from '../2-github/github_api';
import { GistId } from '../2-github/type-aliases';
import { getGist } from '../3-gist/getGist';
import { Gist } from '../3-gist/Gist';
import { tooltip } from '../4-dom/tooltip';
import { removeIndexFomArray } from '../util/removeIndexFromArray';
import { getSetting, Memory, Settings } from './settings';

const files = {
  settings: 'better-gist--settings.json',
  defaults: 'defaults.json',
  memory: 'memory.json',
} as const;

const id = new ClientStorage<GistId | null>('bg.settings.gistId', {});

export function settingsGist(
  defaults: Settings,
  settings: ClientStorage<Partial<Settings>>,
  memory: ClientStorage<Partial<Memory>>,
  onChange: () => void,
) {
  onGistChanged(raw => {
    if (raw.id !== id.cache) return;

    const gist = new Gist(raw);

    if (!gistNeedsUpdate(gist)) {
      updateFromGithub(gist);
    }
  });

  return {
    path: () => (id.cache ? `/gist/${id.cache}/${files.settings}` : null),
    sync,
    removeFrom,
  };

  function removeFrom(list: Gist[]) {
    if (!list.length) {
      return list;
    }

    const index = list.findIndex(isSettingsGist);
    const found = index === -1 ? null : list.find(isSettingsGist);

    if (found) {
      if (found.id !== id.cache) {
        id.set(found.id);
      }

      recreateIfNecessary(found, list.indexOf(found));
    } else if (id.cache) {
      getGist(id.cache).then(gist => {
        if (!gist) {
          id.set(null);
          throw new Error('Settings file is missing');
        }

        recreateIfNecessary(gist);
      });
    } else {
      create();
    }

    return index === -1 ? list : removeIndexFomArray(list, index);
  }

  function recreateIfNecessary(gist: Gist, position = -1) {
    const threshold = getSetting('settingsGistRecreateThreshold');
    const shouldRecreate = position === -1 || position > threshold;

    if (shouldRecreate) {
      return removeGist(gist.id).finally(create);
    }
  }

  function updateFromGithub(gist: Gist) {
    settings.set(read<Partial<Settings>>(gist, files.settings) || defaults);
    memory.set(read<Partial<Memory>>(gist, files.memory) || {});
    onChange();
  }

  async function sync() {
    if (!id.cache) return;
    const gist = await getGist(id.cache);
    if (!gist) return;

    if (gistNeedsUpdate(gist)) {
      return write();
    }
  }

  function gistNeedsUpdate(gist: Gist) {
    return (
      gistFileNeedsUpdate(gist, settings, files.settings) ||
      gistFileNeedsUpdate(gist, memory, files.memory)
    );
  }

  function gistFileNeedsUpdate<T>(
    gist: Gist,
    storage: ClientStorage<T>,
    filename: string,
  ) {
    const content = read<T>(gist, filename);
    const needsUpdate =
      !content ||
      (gist.updatedAt < storage.lastUpdated &&
        serialize(content) !== serialize(storage.cache));

    if (!needsUpdate) {
      storage.set(content!);
    }

    return needsUpdate;
  }

  function read<T>(gist: Gist, filename: string) {
    const file = gist.getFileByName(filename);
    return file && deserialize<T>(file.content);
  }

  async function write() {
    if (!id.cache) {
      return create();
    }

    try {
      return updateGist(id.cache, getGistContent());
    } catch (e) {
      return create();
    }
  }

  async function create() {
    const gist = await createGist(getGistContent());
    id.set(gist.id);
    return new Gist(gist);
  }

  function getGistContent() {
    return {
      description:
        'Gist created by https://gist.amatiasq.com to store settings',
      files: {
        [files.settings]: { content: serialize(settings.cache) },
        [files.defaults]: { content: serialize(defaults) },
        [files.memory]: { content: serialize(memory.cache) },
      },
    };
  }
}

function serialize<T>(value: T) {
  return JSON.stringify(value, null, 2) + '\n';
}

function deserialize<T>(content: string) {
  try {
    return JSON.parse(content) as T;
  } catch (error) {
    console.error(`Invalid settings JSON:`, content);
    tooltip(`Error in settings gist: ${error.message}`);
    return null;
  }
}

function isSettingsGist(gist: Gist) {
  return gist.id === id.cache || gist.hasFile(files.settings);
}
