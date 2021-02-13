import { History } from 'history';
import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';

import { onShortcut } from '../dom/Keyboard';
import { useSetting } from '../hooks/useSetting';
import { requestNewFile } from './EditGist/EditorTabs';
import { createAndNavigateToGist } from './GistList/GistList';

function getCommands(history: History<unknown>) {
  return {
    hideSidebar,
    goBack: () => history.goBack(),
    goForward: () => history.goForward(),
    goHome: () => history.push('/'),
    createGist: () => createAndNavigateToGist(),
    createFile: () => requestNewFile(),
  };
}

export type CommandName = keyof ReturnType<typeof getCommands>;

export function Shortcuts() {
  const history = useHistory();
  const commands = getCommands(history);
  const [rawShortcuts] = useSetting('shortcuts');

  const shortcuts = Object.fromEntries(
    Object.entries(rawShortcuts).map(([key, value]) => [
      key.toUpperCase().replace(/CMD/, 'META'),
      value,
    ]),
  );

  useEffect(
    () =>
      onShortcut(event => {
        const token = event.keys.join('+').toUpperCase();

        if (token in shortcuts) {
          const commandName = shortcuts[token];
          const command = commands[commandName];

          console.log('Shortcut received', token, commandName);

          if (typeof command === 'function') {
            event.preventDefault();
            command();
          }
        }
      }) as () => void,
  );

  return null;
}

const hideSidebar = () => {
  const sidebar = document.querySelector('aside');

  if (!sidebar) {
    return;
  }

  if (sidebar.style.display === 'none') {
    sidebar.style.display = '';
  } else {
    sidebar.style.display = 'none';
  }
};
