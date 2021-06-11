import { CommandName } from '../1-core/commands';

export const DEFAULT_SHORTCUTS: Record<string, CommandName> = {
  'CTRL+TAB': 'goBack',
  'CTRL+SHIFT+TAB': 'goForward',

  'ALT+N': 'toggleWordWrap',

  'CMD+S': 'save',
  'CMD+,': 'settings',
  'CMD+B': 'hideSidebar',
  'CMD+W': 'goHome',
  'CMD+N': 'newNote',

  // 'CMD+ArrowRight': 'nextFile',
  // 'CMD+ArrowLeft': 'prevFile',

  'CTRL+S': 'save',
  'CTRl+,': 'settings',
  'CTRL+B': 'hideSidebar',
  'CTRL+W': 'goHome',
  'CTRL+N': 'newNote',

  // 'ALT+CTRL+META+SHIFT+Space': () =>
  // 'ALT+CMD+CTRL+SHIFT+Space': () =>
};
