import { v4 as uuid } from 'uuid';

import { Note, NoteContent, NoteId } from '../entities/Note';
import { Tag, TagId } from '../entities/Tag';
import { AsyncStore } from '../storage/AsyncStore';
import { MutableCollection } from '../util/MutableCollection';

const NOTES = 'NOTES_KEY';
const TAGS = 'TAGS_KEY';

async function collection<T extends Note | Tag>(store: AsyncStore, key: string) {
  const data = (await store.read<T[]>(key)) || [];
  return new MutableCollection(data, mod => store.write(key, mod));
}

export class NotesService {
  private get notes() {
    return collection<Note>(this.store, NOTES);
  }

  private get tags() {
    return collection<Tag>(this.store, TAGS);
  }

  constructor(private readonly store: AsyncStore) {}

  async fetchNotes() {
    const notes = await this.store.read<Note[]>(NOTES);
    return notes || [];
  }

  async fetchTags() {
    const tags = await this.store.read<Tag[]>(TAGS);
    return tags || [];
  }

  async createNote(content?: NoteContent) {
    const note = createNote(content || ('' as NoteContent));
    const notes = await this.notes;
    notes.add(note);
    await notes.save();
    return note;
  }

  async deleteNote(id: NoteId) {
    const notes = await this.notes;
    notes.remove(id);
    await notes.save();
  }

  async fetchNoteContent(id: NoteId) {
    const result = await this.store.readText(getFilePath(id));
    return result || '';
  }

  async writeNoteContent(id: NoteId, content: NoteContent) {
    const notes = await this.notes;
    const title = getTitleFromContent(content);
    const note = notes.edit(id, x => ({
      ...x,
      title,
      modified: new Date(),
    }));

    await Promise.all([notes.save(), this.store.writeText(getFilePath(id), content)]);
    return note;
  }

  async setFavorite(id: NoteId, isFavorite: boolean) {
    const notes = await this.notes;
    const note = notes.edit(id, x => ({ ...x, favorite: isFavorite }));
    await notes.save();
    return note;
  }

  async setGroup(group: string | null, ids: NoteId[]) {
    const notes = await this.notes;
    const updated = ids.map(id => notes.edit(id, x => ({ ...x, group })));
    await notes.save();
    return updated;
  }

  async createTag(name: string, notes: NoteId[] = []) {
    const tags = await this.tags;
    const id = uuid() as TagId;
    const tag = { id, name, notes };
    tags.add(tag);
    await tags.save();
    return tag;
  }

  async setTagName(id: TagId, name: string) {
    const tags = await this.tags;
    const tag = tags.edit(id, x => ({ ...x, name }));
    await tags.save();
    return tag;
  }

  async editTagNotes(id: TagId, notes: NoteId[]) {
    const tags = await this.tags;
    const tag = tags.edit(id, x => ({ ...x, notes }));
    await tags.save();
    return tag;
  }

  async removeTag(id: TagId) {
    const tags = await this.tags;
    tags.remove(id);
    await tags.save();
  }
}

function createNote(content: NoteContent): Note {
  return {
    id: uuid() as NoteId,
    title: getTitleFromContent(content),
    favorite: false,
    group: null,
    created: new Date(),
    modified: new Date(),
  };
}

function getTitleFromContent(content: NoteContent) {
  return content.split('\n')[0].substr(0, 100) || 'Top Secret';
}

function getFilePath(id: NoteId) {
  return `notes/${id}.md`;
}
