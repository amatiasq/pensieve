import { v4 as uuid } from 'uuid';

import { emitter, emitterWithChannels } from '@amatiasq/emitter';

import { DEFAULT_SETTINGS } from '../5-app/DEFAULT_SETTINGS';
import { Settings } from '../5-app/settings';
import { Note, NoteContent, NoteId } from '../entities/Note';
import { Tag, TagId } from '../entities/Tag';
import { AsyncStore } from '../storage/AsyncStore';
import { RemoteCollection } from '../storage/helpers/RemoteCollection';
import { RemoteValue } from '../storage/helpers/RemoteValue';

export class AppStorage {
  private readonly settings = new RemoteValue<Settings>(this.store, 'settings.json', DEFAULT_SETTINGS);
  private readonly notes = new RemoteCollection<Note, NoteId>(this.store, 'notes.json');
  private readonly tags = new RemoteCollection<Tag, TagId>(this.store, 'tags.json');
  private readonly noteCreated = emitter<Note>();
  private readonly noteChanged = emitterWithChannels<string, Note | null>();
  private readonly noteContentChanged = emitterWithChannels<string, { note: Note; content: NoteContent }>();

  constructor(private readonly store: AsyncStore) {}

  fetchNotes = this.notes.get;
  onNotesChange = this.notes.onChange;

  fetchTags = this.tags.get;
  onTagsChange = this.tags.onChange;

  fetchSettings = this.settings.get;
  setSettings = this.settings.set;
  onSettingsChange = this.settings.onChange;

  onNoteCreated = this.noteCreated.subscribe;
  onNoteChanged = this.noteChanged.subscribe;
  onNoteContentChanged = this.noteContentChanged.subscribe;

  getNote(id: NoteId) {
    return this.notes.item(id);
  }

  async createNote(content?: NoteContent) {
    const note = createNote(content || ('' as NoteContent));
    await this.notes.add(note);
    this.noteCreated(note);
    return note;
  }

  deleteNote(id: NoteId) {
    this.notes.remove(id);
    this.noteChanged(id, null);
  }

  async fetchNoteContent(id: NoteId) {
    const result = await this.store.readText(getFilePath(id));
    return result || '';
  }

  async writeNoteContent(id: NoteId, content: NoteContent) {
    const title = getTitleFromContent(content);

    const [note] = await Promise.all([
      this.notes.edit(id, x => ({ ...x, title, modified: new Date() })),
      this.store.writeText(getFilePath(id), content),
    ]);

    this.noteContentChanged(id, { note, content });
    return note;
  }

  async setFavorite(id: NoteId, isFavorite: boolean) {
    const note = await this.notes.edit(id, x => ({ ...x, favorite: isFavorite }));
    this.noteChanged(note.id, note);
    return note;
  }

  async setGroup(group: string | null, ids: NoteId[]) {
    const notes = await this.notes.get();

    const updated = ids.map(id => {
      const index = notes.findIndex(x => x.id === id);
      if (index === -1) throw new Error('WTF');
      const old = notes[index];
      const note = { ...old, group };
      notes[index] = note;
      return note;
    });

    await this.notes.set(notes);

    for (const note of updated) {
      this.noteChanged(note.id, note);
    }

    return updated;
  }

  async createTag(name: string, notes: NoteId[] = []) {
    const id = uuid() as TagId;
    const tag: Tag = { id, name, notes };
    await this.tags.add(tag);
    return tag;
  }

  setTagName(id: TagId, name: string) {
    return this.tags.edit(id, x => ({ ...x, name }));
  }

  editTagNotes(id: TagId, notes: NoteId[]) {
    return this.tags.edit(id, x => ({ ...x, notes }));
  }

  removeTag(id: TagId) {
    return this.tags.remove(id);
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
