import { serialize, SerializedDate } from '../util/serialization.ts';

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

export type NoteId = '[string NoteId]';
export type NoteContent = string;

export interface Note {
  readonly id: NoteId;
  readonly title: string;
  readonly favorite: boolean;
  readonly group: string | null;
  readonly created: SerializedDate;
  readonly modified: SerializedDate;
  readonly bumped?: SerializedDate;
}

export function isNoteIdentical(a: Note | null, b: Note | null) {
  if ((a == null || b == null) && a !== b) {
    return false;
  }

  return serialize(a) === serialize(b);
}

export function getMetadataFromContent(content: NoteContent) {
  const trimmed = content.trim();
  const lineBreak = trimmed.indexOf('\n');
  const firstLine = lineBreak === -1 ? trimmed : trimmed.substr(0, lineBreak);
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
