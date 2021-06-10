import { getCommand } from '../1-core/commands';
import { onShortcut } from '../1-core/keyboard';
import { DEFAULT_SHORTCUTS } from './DEFAULT_SHORTCUTS';

const normalizeKeys = (x: string) => x.toUpperCase().replace(/CMD|WINDOWS|WIN/, 'META');

export function initShorcuts() {
  // let shortcuts = getShortcuts();

  // onSettingsChanged(() => (shortcuts = getShortcuts()));

  onShortcut(event => {
    const keys = event.keys.join('+').toUpperCase();

    if (event.keys.length > 1) {
      console.log(keys);
    }

    if (keys in shortcuts) {
      const commandName = shortcuts[keys];
      const command = getCommand(commandName);

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

  function getShortcuts() {
    const value = /*getSetting('shortcuts') ||*/ DEFAULT_SHORTCUTS;

    return Object.fromEntries(Object.entries(value).map(([key, value]) => [normalizeKeys(key), value]));
  }
}
