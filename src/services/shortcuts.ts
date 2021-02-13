import { getCommand } from '../services/commands';
import { onSettingsChanged } from './cache-invalidation';
import { onShortcut } from './keyboard';
import { getSetting } from './settings';

const normalizeKeys = (x: string) =>
  x.toUpperCase().replace(/CMD|WINDOWS|WIN/, 'META');

let shortcuts = getShortcuts();
onSettingsChanged(() => (shortcuts = getShortcuts()));

onShortcut(event => {
  const keys = event.keys.join('+').toUpperCase();

  if (keys in shortcuts) {
    const commandName = shortcuts[keys];
    const command = getCommand(commandName);

    console.log('Shortcut received', {
      keys,
      commandName,
      command,
    });

    if (typeof command === 'function') {
      event.preventDefault();
      command();
    }
  }
});

function getShortcuts() {
  return Object.fromEntries(
    Object.entries(getSetting('shortcuts')).map(([key, value]) => [
      normalizeKeys(key),
      value,
    ]),
  );
}
