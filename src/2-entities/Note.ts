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
  const [rawTitle, rawGroup] = content.split('\n');
  // const rawTitle = getTitleFromContent(content);
  const extension = getExtensionFromTitle(rawTitle);
  const comment = getCommentFromExtension(extension);
  const title = clean(rawTitle, `${comment}+`) || 'Top Secret';
  const group = clean(rawGroup, `${comment} group:`) || null;

  return { title, group, extension, content };
}

function clean(text = '', startsWith: string) {
  return text
    .trim()
    .replace(new RegExp(`^${startsWith}`), '')
    .trim()
    .substr(0, 100);
}

function getExtensionFromTitle(title: string) {
  const match = title.match(/(\.\w+)+$/);
  return match ? match[0] : '.md';
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
