import { serialize } from '../util/serialization.ts';

export const DEFAULT_SHORTCUTS: Shortcuts = {
  'CTRL+TAB': 'goBack',
  'CTRL+SHIFT+TAB': 'goForward',

  'ALT+N': 'toggleWordWrap',

  'CMD+S': 'save',
  'CMD+,': 'settings',
  'CMD+B': 'hideSidebar',
  'CMD+W': 'goHome',
  'CMD+N': 'newNote',

  'CMD+SHIFT+E': 'clearFilter',

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
  | 'clearFilter'
  | 'goBack'
  | 'goForward'
  | 'goHome'
  | 'hideSidebar'
  | 'newNote'
  | 'save'
  | 'settings'
  | 'toggleWordWrap';

export type Shortcuts = Record<string, ShortcutCommand>;

export function areShortcutsIdentical(a: Shortcuts, b: Shortcuts) {
  return serialize(a) === serialize(b);
}
