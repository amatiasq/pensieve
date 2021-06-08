import { Note, NoteContent, NoteId } from '../entities/Note';
import { Tag, TagId } from '../entities/Tag';

export interface DataSource {
  // List
  fetchNotes(): Promise<Note[]>;
  fetchTags(): Promise<Tag[]>;

  // Create / delete
  createNote(content?: NoteContent): Promise<Note>;
  deleteNote(id: NoteId): Promise<void>;

  // Content
  fetchNoteContent(id: NoteId): Promise<NoteContent>;
  writeNoteContent(id: NoteId, content: NoteContent): Promise<Note>;

  // Props
  setFavorite(id: NoteId, isFavorite: boolean): Promise<Note>;
  setGroup(group: string | null, notes: NoteId[]): Promise<Note[]>;

  // Tagging
  createTag(name: string, notes?: NoteId[]): Promise<Tag>;
  setTagName(id: TagId, name: string): Promise<Tag>;
  editTagNotes(id: TagId, notes: NoteId[]): Promise<Tag>;
  removeTag(id: TagId): Promise<void>;
}
