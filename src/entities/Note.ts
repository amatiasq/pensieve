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
