import { Note, NoteContent, NoteId } from '../entities/Note';
import { Tag, TagId } from '../entities/Tag';
import { LocalCache } from '../util/LocalCache';
import { DataSource } from './DataSource';

export class OfflineCache implements DataSource {
  private readonly notes = LocalCache.as<Note[]>('NOTES');
  private readonly tags = LocalCache.as<Tag[]>('TAGS');

  constructor(private readonly dest: DataSource) {}

  private async fallback<T>(cache: LocalCache<T>, operation: () => Promise<T>) {
    try {
      const result = await operation();
      cache.set(result);
      return result;
    } catch (error) {
      const cached = await cache.get();
      if (cached) return cached;
      throw error;
    }
  }

  fetchNotes(): Promise<Note[]> {
    return this.fallback(this.notes, () => this.dest.fetchNotes());
  }

  fetchTags(): Promise<Tag[]> {
    return this.fallback(this.tags, () => this.dest.fetchTags());
  }

  async createNote(content?: NoteContent): Promise<Note> {
    throw new Error('Method not implemented.');
  }

  async deleteNote(id: NoteId): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async fetchNoteContent(id: NoteId): Promise<NoteContent> {
    throw new Error('Method not implemented.');
  }

  async writeNoteContent(id: NoteId, content: string): Promise<Note> {
    throw new Error('Method not implemented.');
  }

  async setFavorite(id: NoteId, isFavorite: boolean): Promise<Note> {
    throw new Error('Method not implemented.');
  }

  async setGroup(group: string | null, notes: NoteId[]): Promise<Note[]> {
    throw new Error('Method not implemented.');
  }

  async createTag(name: string, notes?: NoteId[]): Promise<Tag> {
    throw new Error('Method not implemented.');
  }

  async setTagName(id: TagId, name: string): Promise<Tag> {
    throw new Error('Method not implemented.');
  }

  async editTagNotes(id: TagId, notes: NoteId[]): Promise<Tag> {
    throw new Error('Method not implemented.');
  }

  async removeTag(id: TagId): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
