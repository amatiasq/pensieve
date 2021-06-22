import { serialize } from '../util/serialization';

export const DEFAULT_SETTINGS = {
  autosave: 5,
  // defaultFileExtension: '.md',
  // displayShortcutsAsTooltip: true,
  reloadIfAwayForSeconds: 5,
  renderIndentGuides: false,
  rulers: [],
  sidebarVisible: true,
  sidebarWidth: 400,
  starNewNotes: true,
  tabSize: 2,
  //welcomeGist: 'd195304f7bb1b8d5f3e76392c4a6cd01' as NoteId,
  wordWrap: true,
};

export type Settings = typeof DEFAULT_SETTINGS;

export function areSettingsIdentical(a: Settings, b: Settings) {
  return serialize(a) === serialize(b);
}
