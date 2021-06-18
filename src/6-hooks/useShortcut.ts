import { useContext, useEffect } from 'react';

import { onShortcut } from '../1-core/keyboard';
import {
  DEFAULT_SHORTCUTS,
  ShortcutCommand,
  Shortcuts
} from '../2-entities/Shortcuts';
import { AppStorage } from '../4-storage/AppStorage';
import { AppStorageContext } from '../5-app/contexts';
import { deserialize, serialize } from '../util/serialization';

type Executor = () => void;

const commands: Partial<Record<ShortcutCommand, Executor>> = {};
let initialized = false;

export function useShortcut(name: ShortcutCommand, execute: Executor) {
  const before = commands[name];

  useEffect(() => {
    commands[name] = execute;
    return () => {
      commands[name] = before;
    };
  });

  if (!initialized) {
    const store = useContext(AppStorageContext);
    init(store);
  }
}

function init(store: AppStorage) {
  let shortcuts = parseShortcuts(DEFAULT_SHORTCUTS);

  const setShortcuts = (x: string) =>
    (shortcuts = parseShortcuts(deserialize(x)));

  store.shortcuts.watch(serialize(DEFAULT_SHORTCUTS)).subscribe(setShortcuts);

  onShortcut(event => {
    const keys = event.keys.join('+').toUpperCase();

    if (event.keys.length > 1) {
      console.log(keys);
    }

    if (keys in shortcuts) {
      const commandName = shortcuts[keys];
      const command = commands[commandName] || null;

      console.log('Shortcut received', {
        keys,
        commandName,
        command,
      });

      if (typeof command === 'function') {
        // if (getSetting('displayShortcutsAsTooltip')) {
        //   tooltip(keys.replace('META', 'CMD'));
        // }

        event.preventDefault();
        command();
      }
    }
  });

  initialized = true;
}

function parseShortcuts(value: Shortcuts) {
  return Object.fromEntries(
    Object.entries(value).map(([key, value]) => [normalizeKeys(key), value]),
  );
}

function normalizeKeys(x: string) {
  return x.toUpperCase().replace(/CMD|WINDOWS|WIN/, 'META');
}
