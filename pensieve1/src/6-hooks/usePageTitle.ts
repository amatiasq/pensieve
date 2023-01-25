import { ghRepository } from '../3-github/gh-utils';

const separator = '  ';

const appTitle =
  ghRepository
    .replace(/\W+/gi, ' ')
    .replace(/\s+/g, ' ')
    .replace(/(?<= )(\w)/g, x => x[0].toUpperCase())
    .replace(/^(\w)/g, x => x[0].toUpperCase())
    .replace('Pensieve', '')
    .replace('Data', '')
    .trim() || 'Pensieve';

set();

export function usePageTitle() {
  return set;
}

function set(name?: string) {
  const app = `✏️${separator}${appTitle}`;
  const section = name?.trim();
  const full = section ? `${section}${separator}${app}` : app;

  if (document.title !== full) {
    document.title = full;
  }
}
