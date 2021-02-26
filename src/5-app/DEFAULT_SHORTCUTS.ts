import { CommandName } from '../1-core/commands';

export const DEFAULT_SHORTCUTS: Record<string, CommandName> = {
  'CTRL+TAB': 'goBack',
  'CTRL+SHIFT+TAB': 'goForward',

  'ALT+N': 'toggleWordWrap',

  'CMD+S': 'saveCurrentFile',
  'CMD+,': 'settings',
  'CMD+B': 'hideSidebar',
  'CMD+W': 'goHome',
  'CMD+N': 'createGist',
  'CMD+T': 'createFile',

  // 'CMD+ArrowRight': 'nextFile',
  // 'CMD+ArrowLeft': 'prevFile',

  'CTRL+S': 'saveCurrentFile',
  'CTRl+,': 'settings',
  'CTRL+B': 'hideSidebar',
  'CTRL+W': 'goHome',
  'CTRL+N': 'createGist',
  'CTRL+T': 'createFile',

  // 'ALT+CTRL+META+SHIFT+Space': () =>
  // 'ALT+CMD+CTRL+SHIFT+Space': () =>
};
