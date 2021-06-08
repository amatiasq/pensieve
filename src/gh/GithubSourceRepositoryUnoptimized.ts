import { v4 as uuid } from 'uuid';

import { Note, NoteContent, NoteId } from '../entities/Note';
import { Tag, TagId } from '../entities/Tag';
import { GithubToken } from './api/GithubApi';
import { GithubRepository } from './api/GithubRepository';
import { GithubNotesSource } from './GithubNotesSource';

const NOTES_FILE = 'notes.json';
const TAGS_FILE = 'categories.json';

export class GithubSourceRepository implements GithubNotesSource {
  private readonly repo: GithubRepository;

  constructor(token: GithubToken, username: string) {
    this.repo = new GithubRepository(token, username, 'takenote-data');
  }

  async fetchNotes(): Promise<Note[]> {
    const { json } = await this.repo.readJsonFile<Note[]>(NOTES_FILE);
    return json;
  }

  async fetchTags(): Promise<Tag[]> {
    const { json } = await this.repo.readJsonFile<Tag[]>(TAGS_FILE);
    return json;
  }

  async createNote(content?: NoteContent): Promise<Note> {
    const notes = await this.fetchNotes();
    const newNote = createNote(content || '');
    const { id, title } = newNote;

    await this.repo.commit(`Create ${title}`, {
      [NOTES_FILE]: [newNote, ...notes],
      [getFilePath(id)]: content,
    });

    return newNote;
  }

  async deleteNote(id: NoteId): Promise<void> {
    const notes = await this.fetchNotes();
    const [note, update] = editArrayItem(notes, id);

    if (!note) return;

    await this.repo.commit(`Remove ${note.title}`, {
      [NOTES_FILE]: update(),
      [getFilePath(id)]: null,
    });
  }

  async fetchNoteContent(id: NoteId): Promise<NoteContent> {
    const { content } = await this.repo.readFile(getFilePath(id));
    return content;
  }

  async writeNoteContent(id: NoteId, content: NoteContent): Promise<Note> {
    const notes = await this.fetchNotes();
    const [note, update] = editArrayItem(notes, id);

    if (!note) {
      return this.createNote(content);
    }

    const title = getTitleFromContent(content);
    const updatedNote = {
      ...note,
      title,
      modified: new Date(),
    };

    await this.repo.commit(`Update ${title}`, {
      [NOTES_FILE]: update(updatedNote),
      [getFilePath(id)]: content,
    });

    return updatedNote;
  }

  async setFavorite(id: NoteId, isFavorite: boolean): Promise<Note> {
    const notes = await this.fetchNotes();
    const [note, update] = editArrayItem(notes, id);
    if (!note) throw new Error(`Note ${id} not found`);

    const updatedNote = {
      ...note,
      favorite: isFavorite,
    };

    await this.repo.commit(`${isFavorite ? 'Star' : 'Unstar'} ${note.title}`, {
      [NOTES_FILE]: update(updatedNote),
    });

    return updatedNote;
  }

  async setGroup(group: string | null, ids: NoteId[]): Promise<Note[]> {
    const notes = [...(await this.fetchNotes())];

    const updated = ids.map(id => {
      const index = notes.findIndex(x => x.id === id);
      const note = notes[index];
      const updatedNote = { ...note, group };
      notes[index] = updatedNote;
      return updatedNote;
    });

    await this.repo.commit(`Group ${group}`, {
      [NOTES_FILE]: notes,
    });

    return updated;
  }

  async createTag(name: string, notes: NoteId[] = []): Promise<Tag> {
    const tags = await this.fetchTags();
    const id = uuid();
    const tag = { id, name, notes };

    await this.repo.commit(`Create tag ${name}`, {
      [TAGS_FILE]: [tag, ...tags],
    });

    return tag;
  }

  async setTagName(id: TagId, name: string): Promise<Tag> {
    const tags = await this.fetchTags();
    const [tag, update] = editArrayItem(tags, id);

    if (!tag) {
      throw new Error(`Unknown tag with id: ${id}`);
    }

    const updatedTag = { ...tag, name };

    await this.repo.commit(`Rename tag ${tag.name} to ${name}`, {
      [TAGS_FILE]: update(updatedTag),
    });

    return updatedTag;
  }

  async editTagNotes(id: TagId, notes: NoteId[]): Promise<Tag> {
    const tags = await this.fetchTags();
    const [tag, update] = editArrayItem(tags, id);

    if (!tag) {
      throw new Error(`Unknown tag with id: ${id}`);
    }

    const updatedTag = { ...tag, notes };

    await this.repo.commit(`Update ${tag.name} items: ${notes.length}`, {
      [TAGS_FILE]: update(updatedTag),
    });

    return updatedTag;
  }

  async removeTag(id: TagId): Promise<void> {
    const tags = await this.fetchTags();
    const [tag, update] = editArrayItem(tags, id);

    if (!tag) {
      throw new Error(`Unknown tag with id: ${id}`);
    }

    await this.repo.commit(`Remove tag ${tag.name}`, {
      [TAGS_FILE]: update(),
    });
  }
}

function editArrayItem<T extends { id: U }, U>(array: T[], id: U) {
  const index = array.findIndex(x => x.id === id);
  const item = array[index];
  const before = array.slice(0, index);
  const after = array.slice(index + 1);

  return [
    item,
    (updated?: T) =>
      updated ? [...before, updated, ...after] : [...before, ...after],
  ] as const;
}

function createNote(content: NoteContent): Note {
  return {
    id: uuid(),
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
