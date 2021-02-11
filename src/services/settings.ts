import { ClientStorage } from '@amatiasq/client-storage';

export interface Settings {
  sidebarWidth: number;
  autosave: number | null;
  reloadIfAwayForSeconds: number | null;
}

const settingsGistId = new ClientStorage<string>('gist.settings.gist');
const settings = new ClientStorage<Settings>('gists.settings', {
  default: {
    sidebarWidth: 400,
    autosave: 5,
    reloadIfAwayForSeconds: 5,
  },
});

// TODO:
// save settings to gits if not exists
// Save gist id
// Load settings from gist if present

export function getSetting<Key extends keyof Settings>(key: Key) {
  return get()[key];
}

export function setSetting<Key extends keyof Settings>(
  key: Key,
  value: Settings[Key],
) {
  settings.set({ ...get(), [key]: value });
}

function get() {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return settings.get()!;
}
