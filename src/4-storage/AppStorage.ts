import { v4 as uuid } from 'uuid';

import { emitterWithChannels } from '@amatiasq/emitter';

import {
  getMetadataFromContent,
  Note,
  NoteContent,
  NoteId
} from '../2-entities/Note';
import { DEFAULT_SETTINGS, Settings } from '../2-entities/Settings';
import { DEFAULT_SHORTCUTS, Shortcuts } from '../2-entities/Shortcuts';
import { AsyncStore } from './AsyncStore';
import { RemoteCollection } from './helpers/RemoteCollection';
import { RemoteValue } from './helpers/RemoteValue';

export class AppStorage<ReadOptions, WriteOptions> {
  readonly settings = new RemoteValue(
    this.store,
    'settings.json',
    DEFAULT_SETTINGS as Settings,
  );

  readonly shortcuts = new RemoteValue(
    this.store,
    'shortcuts.json',
    DEFAULT_SHORTCUTS as Shortcuts,
  );

  private readonly notes = new RemoteCollection<
    Note,
    NoteId,
    ReadOptions,
    WriteOptions
  >(this.store, 'README.md');

  private readonly noteChanged = emitterWithChannels<string, Note | null>();
  private readonly noteContentChanged =
    emitterWithChannels<string, NoteContent>();

  constructor(private readonly store: AsyncStore<ReadOptions, WriteOptions>) {}

  getNotes = this.notes.get;
  onNotesChange = this.notes.onChange;
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
    const result = await this.store.read(getFilePath(id));
    return result || '';
  }

  async setNoteContent(
    id: NoteId,
    content: NoteContent,
    options?: WriteOptions,
  ) {
    const { title, group } = getMetadataFromContent(content);

    const [note] = await Promise.all([
      this.notes.edit(id, x => ({ ...x, title, group, modified: new Date() })),
      this.store.write(getFilePath(id), content, options),
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
