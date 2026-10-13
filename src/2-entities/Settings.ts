import { serialize } from '../util/serialization.ts';

export const DEFAULT_SETTINGS = {
  autosave: 5,
  reloadIfAwayForSeconds: 5,
  renderIndentGuides: false,
  rulers: [],
  sidebarVisible: true,
  sidebarWidth: 400,
  starNewNotes: true,
  tabSize: 2,
  wordWrap: true,

  highlight: {
    '~~[^~]*~~': '#505050',
    '@(\\w|-)+': '#6fb9ef',
  } as Record<string, string>,

  links: {
    '\\[(\\w+/\\w+)]': `https://github.com/$1`,
  } as Record<string, string>,

  folders: {
    Snippets: {},
  } as Record<string, Record<string, never>>,
};

export type Settings = typeof DEFAULT_SETTINGS;

export function areSettingsIdentical(a: Settings, b: Settings) {
  return serialize(a) === serialize(b);
}
