import { v4 as uuid } from 'uuid';

import { Scheduler } from '@amatiasq/scheduler';

import { Note, NoteContent, NoteId } from '../entities/Note';
import { Tag, TagId } from '../entities/Tag';
import { DataSource } from '../services/DataSource';
import { RemoteCollection } from '../util/RemoteArray';
import { GithubRepository, StagedFiles } from './api/GithubRepository';

const NOTES_FILE = 'notes.json';
const TAGS_FILE = 'categories.json';

const throttledCommitSeconds = 1;
const cacheLifespanSeconds = 30;

export class GithubSourceRepository implements DataSource {
  private notes = new RemoteCollection(
    () => this.fetchArray<Note>(NOTES_FILE),
    { cacheLifespanSeconds },
  );
  private tags = new RemoteCollection(() => this.fetchArray<Tag>(TAGS_FILE), {
    cacheLifespanSeconds,
  });

  private staged: StagedFiles = {};
  private readonly messages = new Set<string>();
  private readonly scheduler = new Scheduler(
    throttledCommitSeconds * 1000,
    () => this.applyCommit(),
  );

  constructor(private readonly repo: GithubRepository) {}

  async fetchNotes(): Promise<Note[]> {
    return this.notes.asArray();
  }

  async fetchTags(): Promise<Tag[]> {
    return this.tags.asArray();
  }

  async createNote(content?: NoteContent): Promise<Note> {
    const newNote = createNote(content || '');
    const { id, title } = newNote;

    const notes = await this.notes.asCollection();
    notes.add(newNote);

    this.commit(`Create ${title}`, {
      [NOTES_FILE]: notes,
      [getFilePath(id)]: content,
    });

    return newNote;
  }

  async deleteNote(id: NoteId): Promise<void> {
    const notes = await this.notes.asCollection();
    const removed = notes.remove(id);
    if (!removed) return;

    this.commit(`Remove ${removed.title}`, {
      [NOTES_FILE]: notes,
      [getFilePath(id)]: null,
    });
  }

  async fetchNoteContent(id: NoteId): Promise<NoteContent> {
    const { content } = await this.repo.readFile(getFilePath(id));
    return content;
  }

  async writeNoteContent(id: NoteId, content: NoteContent): Promise<Note> {
    const notes = await this.notes.asCollection();

    const title = getTitleFromContent(content);
    const note = notes.edit(id, x => ({
      ...x,
      title,
      modified: new Date(),
    }));

    this.commit(`Update ${title}`, {
      [NOTES_FILE]: notes,
      [getFilePath(id)]: content,
    });

    return note;
  }

  async setFavorite(id: NoteId, isFavorite: boolean): Promise<Note> {
    const notes = await this.notes.asCollection();
    const note = notes.edit(id, x => ({ ...x, favorite: isFavorite }));

    this.commit(`${isFavorite ? 'Star' : 'Unstar'} ${note.title}`, {
      [NOTES_FILE]: notes,
    });

    return note;
  }

  async setGroup(group: string | null, ids: NoteId[]): Promise<Note[]> {
    const notes = await this.notes.asCollection();
    const updated = ids.map(id => notes.edit(id, x => ({ ...x, group })));

    this.commit(`Group ${group}`, { [NOTES_FILE]: notes });

    return updated;
  }

  async createTag(name: string, notes: NoteId[] = []): Promise<Tag> {
    const tags = await this.tags.asCollection();
    const id = uuid() as TagId;
    const tag = { id, name, notes };

    tags.add(tag);
    this.commit(`Create tag ${name}`, { [TAGS_FILE]: tags });

    return tag;
  }

  async setTagName(id: TagId, name: string): Promise<Tag> {
    const tags = await this.tags.asCollection();
    const tag = tags.edit(id, x => ({ ...x, name }));

    this.commit(`Rename tag ${tag.name} to ${name}`, { [TAGS_FILE]: tags });

    return tag;
  }

  async editTagNotes(id: TagId, notes: NoteId[]): Promise<Tag> {
    const tags = await this.tags.asCollection();
    const tag = tags.edit(id, x => ({ ...x, notes }));

    this.commit(`Update ${tag.name} items: ${notes.length}`, {
      [TAGS_FILE]: tags,
    });

    return tag;
  }

  async removeTag(id: TagId): Promise<void> {
    const tags = await this.tags.asCollection();
    const tag = tags.remove(id);
    if (!tag) return;

    await this.repo.commit(`Remove tag ${tag.name}`, { [TAGS_FILE]: tags });
  }

  private async fetchArray<T>(file: string) {
    const { json } = await this.repo.readJsonFile<T[]>(file);
    return json;
  }

  private commit(message: string, files: StagedFiles) {
    this.messages.add(message);
    this.staged = { ...this.staged, files };
    this.scheduler.restart();
  }

  private applyCommit() {
    if (!this.messages.size) return;

    const staged = this.staged;
    const messages = Array.from(this.messages);
    const message =
      messages.length > 1
        ? `Multiple:\n- ${messages.join('\n- ')}`
        : messages[0];

    this.messages.clear();
    this.staged = {};

    return this.repo.commit(message, staged);
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
  return content.split('\n')[0].substr(0, 100);
}

function getFilePath(id: NoteId) {
  return `notes/${id}.md`;
}
