export type NoteId = '[string NoteId]';
export type NoteContent = string;

export interface Note {
  readonly id: NoteId;
  readonly title: string;
  readonly favorite: boolean;
  readonly group: string | null;
  readonly created: Date;
  readonly modified: Date;
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
  const match = title.match(/(\.\w+)+$/);
  return match ? match[0] : '.md';
}

function removeCommentFrom(text: string, extension: string) {
  const remover = getCommentRemover(extension);
  return text.trim().replace(remover, '').trim();
}

function getCommentRemover(extension: string) {
  const comment = getCommentFromExtension(extension);
  return new RegExp(`^\\s*(${comment})+`);
}

function getCommentFromExtension(extension: string) {
  const comments: Record<string, string> = {
    '.sql': '--',
    '.md': '#',
    '.sh': '#',
    '.js': '//',
    '.ts': '//',
    '.cs': '//',
    '.fs': '//',
  };

  return comments[extension] || '//';
}
