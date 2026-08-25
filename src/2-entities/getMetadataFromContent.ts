// `import type`: la terminal carga este fichero sin las dependencias de la app
// (`amq pensieve edit`), y un import de valor traería `Note.ts` y su JSON5.
import type { NoteContent } from './Note.ts';

const COMMENTS_BY_LANG: Record<string, [string] | [string, string]> = {
  '.cs': ['//'],
  '.fs': ['//'],
  '.html': ['<!--', '-->'],
  '.js': ['//'],
  '.md': ['#'],
  '.mermaid': ['%%'],
  '.mmd': ['%%'],
  '.py': ['#'],
  '.sh': ['#'],
  '.sql': ['--'],
  '.ts': ['//'],
  '.yaml': ['#'],
  '.yml': ['#'],
};

export function getMetadataFromContent(content: NoteContent) {
  const trimmed = content.trim();
  const lineBreak = trimmed.indexOf('\n');
  const firstLine = lineBreak === -1 ? trimmed : trimmed.slice(0, lineBreak);
  const extension = getExtensionFor(firstLine);
  const cleanLine = removeCommentFrom(firstLine, extension);

  const [title, group] = cleanLine
    .split('/')
    .reverse()
    .map(x => x.trim());

  return { title, group, extension, content };
}

function getExtensionFor(title: string) {
  const closing = Object.values(COMMENTS_BY_LANG)
    .map(x => x[1])
    .filter(Boolean)
    .map(x => new RegExp(`${x}$`));

  const cleanTitle = closing
    .reduce((acc, reg) => acc.replace(reg, ''), title)
    .trim();

  const match = cleanTitle.match(/(\.\w+)+$/);
  return match ? match[0] : '.md';
}

function removeCommentFrom(text: string, extension: string) {
  const [open, close] = COMMENTS_BY_LANG[extension] || ['//'];
  const clean = text.trim().replace(new RegExp(`^${open}`), '');
  return close ? clean.replace(new RegExp(`${close}$`), '') : clean;
}
