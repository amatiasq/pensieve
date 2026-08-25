import { SerializedDate } from '../util/datestr.ts';
import { serialize } from '../util/serialization.ts';

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
