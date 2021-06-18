import { distinctUntilChanged, mergeWith, throttleTime } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';

import { emitterWithChannels } from '@amatiasq/emitter';

import {
  getMetadataFromContent,
  Note,
  NoteContent,
  NoteId
} from '../2-entities/Note';
import { DEFAULT_SETTINGS } from '../2-entities/Settings';
import { DEFAULT_SHORTCUTS } from '../2-entities/Shortcuts';
import { fromEmitterWithChannels, fromPromise } from '../util/rxjs-extensions';
import { serialize } from '../util/serialization';
import { RemoteCollection } from './helpers/RemoteCollection';
import { RemoteString } from './helpers/RemoteString';
import { FinalStore, FinalWriteOptions } from './index';

export class AppStorage {
  readonly settings = new RemoteString(
    this.store,
    'settings.json',
    serialize(DEFAULT_SETTINGS),
  );

  readonly shortcuts = new RemoteString(
    this.store,
    'shortcuts.json',
    serialize(DEFAULT_SHORTCUTS),
  );

  private readonly notes = new RemoteCollection<Note, NoteId>(
    this.store,
    'README.md',
  );

  private readonly noteSaved = emitterWithChannels<NoteId, Note | null>();
  private readonly noteContentSaved =
    emitterWithChannels<NoteId, NoteContent>();
  private readonly noteTitleUpdated = emitterWithChannels<NoteId, string>();

  constructor(private readonly store: FinalStore) {}

  getNotes() {
    return this.notes.watch([]);
  }

  watchNote(id: NoteId) {
    return this.notes.watchItem(id);
  }

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

    this.noteSaved(id, null);
  }

  updateNoteContent(id: NoteId, content: NoteContent) {
    const { title } = getMetadataFromContent(content);
    this.noteTitleUpdated(id, title);
  }

  onNoteTitleChanged(id: NoteId) {
    return fromEmitterWithChannels(this.noteTitleUpdated, id).pipe(
      throttleTime(100),
      distinctUntilChanged(),
    );
  }

  watchNoteContent(id: NoteId) {
    const key = getFilePath(id);
    const changes = this.store.onChange(key);

    return fromPromise(this.readNoteContent(id)).pipe(
      mergeWith(changes),
      distinctUntilChanged(),
    );
  }

  readNoteContent(id: NoteId) {
    return this.store.read(getFilePath(id));
  }

  async saveNoteContent(
    id: NoteId,
    content: NoteContent,
    options?: FinalWriteOptions,
  ) {
    const { title, group } = getMetadataFromContent(content);

    const [note] = await Promise.all([
      this.notes.edit(id, x => ({ ...x, title, group, modified: new Date() })),
      this.store.write(getFilePath(id), content, options),
    ]);

    this.noteContentSaved(id, content);
    return note;
  }

  async toggleFavorite(id: NoteId) {
    const note = await this.notes.edit(id, x => ({
      ...x,
      favorite: !x.favorite,
    }));

    this.noteSaved(id, note);
    return note;
  }

  async setGroup(group: string | null, ids: NoteId[]) {
    const notes = await this.notes.read();

    const updated = ids.map(id => {
      const index = notes.findIndex(x => x.id === id);
      if (index === -1) throw new Error('WTF');
      const old = notes[index];
      const note = { ...old, group };
      notes[index] = note;
      return note;
    });

    await this.notes.write(notes);

    for (const note of updated) {
      this.noteSaved(note.id, note);
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
