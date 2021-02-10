import { ClientStorage } from '@amatiasq/client-storage';

export interface Settings {
  sidebarWidth: number;
}

const settings = new ClientStorage<Settings>('gists.settings', {
  default: {
    sidebarWidth: 400,
  },
});

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
