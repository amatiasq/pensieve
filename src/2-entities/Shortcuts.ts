export const DEFAULT_SHORTCUTS: Shortcuts = {
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

export type ShortcutCommand =
  | 'newNote'
  | 'goBack'
  | 'goForward'
  | 'goHome'
  | 'hideSidebar'
  | 'save'
  | 'settings'
  | 'toggleWordWrap';

export type Shortcuts = Record<string, ShortcutCommand>;
