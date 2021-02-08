import { ClientStorage } from '@amatiasq/client-storage';

interface Settings {
  sidebarWidth: number;
}

const settings = new ClientStorage<Settings>('np.sidebar-size', {
  default: {
    sidebarWidth: 400,
  },
});

export function getSetting(key: keyof Settings) {
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
