import { NoteId } from './Note';

export type TagId = '[string TagId]';

export interface Tag {
  readonly id: TagId;
  readonly name: string;
  readonly notes: NoteId[];
}
