import { v4 as uuid } from 'uuid';

import { emitterWithChannels } from '@amatiasq/emitter';

import { Note, NoteContent, NoteId } from '../2-entities/Note';
import { Settings } from '../2-entities/Settings';
import { Tag, TagId } from '../2-entities/Tag';
import { DEFAULT_SETTINGS } from '../5-app/DEFAULT_SETTINGS';
import { AsyncStore } from './AsyncStore';
import { RemoteCollection } from './helpers/RemoteCollection';
import { RemoteValue } from './helpers/RemoteValue';

export class AppStorage {
  private readonly settings = new RemoteValue<Settings>(
    this.store,
    'settings.json',
    DEFAULT_SETTINGS,
  );
  private readonly notes = new RemoteCollection<Note, NoteId>(
    this.store,
    'notes.json',
  );
  private readonly tags = new RemoteCollection<Tag, TagId>(
    this.store,
    'tags.json',
  );
  private readonly noteChanged = emitterWithChannels<string, Note | null>();
  private readonly noteContentChanged =
    emitterWithChannels<string, NoteContent>();

  constructor(private readonly store: AsyncStore) {}

  getNotes = this.notes.get;
  onNotesChange = this.notes.onChange;

  getTags = this.tags.get;
  onTagsChange = this.tags.onChange;

  getSettings = this.settings.get;
  setSettings = this.settings.set;
  onSettingsChange = this.settings.onChange;

  onNoteChanged = this.noteChanged.subscribe;
  onNoteContentChanged = this.noteContentChanged.subscribe;

  getNote(id: NoteId) {
    return this.notes.item(id);
  }

  async createNote(content?: NoteContent) {
    const note = createNote(content || ('' as NoteContent));
    await this.notes.add(note);
    return note;
  }

  async deleteNote(id: NoteId) {
    const contentFile = getFilePath(id);
    const hasContent = await this.store.has(contentFile);

    await Promise.all([
      this.notes.remove(id),
      hasContent ? this.store.delete(contentFile) : null,
    ]);

    this.noteChanged(id, null);
  }

  async getNoteContent(id: NoteId) {
    const result = await this.store.readText(getFilePath(id));
    return result || '';
  }

  async setNoteContent(id: NoteId, content: NoteContent) {
    const { title, group } = getMetadataFromContent(content);

    const [note] = await Promise.all([
      this.notes.edit(id, x => ({ ...x, title, group, modified: new Date() })),
      this.store.writeText(getFilePath(id), content),
    ]);

    this.noteContentChanged(id, content);
    return note;
  }

  async toggleFavorite(id: NoteId) {
    const note = await this.notes.edit(id, x => ({
      ...x,
      favorite: !x.favorite,
    }));

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

  setTagNotes(id: TagId, notes: NoteId[]) {
    return this.tags.edit(id, x => ({ ...x, notes }));
  }

  removeTag(id: TagId) {
    return this.tags.remove(id);
  }
}

function createNote(content: NoteContent): Note {
  const { title } = getMetadataFromContent(content);

  return {
    id: uuid() as NoteId,
    title,
    favorite: true,
    group: null,
    created: new Date(),
    modified: new Date(),
  };
}

function getFilePath(id: NoteId) {
  return /(\.\w+)+$/.test(id) ? `notes/${id}` : `notes/${id}.md`;
}

function getMetadataFromContent(content: NoteContent) {
  const [rawTitle, rawGroup] = content.split('\n');
  // const rawTitle = getTitleFromContent(content);
  const extension = getExtensionFromTitle(rawTitle);
  const comment = getCommentFromExtension(extension);
  const title = clean(rawTitle, `${comment}+`) || 'Top Secret';
  const group = clean(rawGroup, `${comment} group:`) || null;

  return { title, group, extension, content };

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
}
