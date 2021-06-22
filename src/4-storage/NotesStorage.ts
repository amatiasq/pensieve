import { v4 as uuid } from 'uuid';

import { messageBus } from '../1-core/messageBus';
import {
  getMetadataFromContent,
  Note,
  NoteContent,
  NoteId
} from '../2-entities/Note';
import { DEFAULT_SETTINGS, Settings } from '../2-entities/Settings';
import { DEFAULT_SHORTCUTS, Shortcuts } from '../2-entities/Shortcuts';
import { deserialize, serialize } from '../util/serialization';
import { fetchValue } from './helpers/fetchValue';
import { RemoteJson } from './helpers/RemoteJson';
import { RemoteValue } from './helpers/RemoteValue';
import { MixedStore } from './middleware/MixedStore';
import { RemoteNote } from './RemoteNote';

const getNotesPath = () => 'meta/*';
const getNotePath = (id: NoteId) => `meta/${id}.json`;
const getContentPath = (id: NoteId) => `note/${id}`;

export class NotesStorage {
  private readonly notes = new Map<NoteId, RemoteNote>();
  private readonly emitNoteCreate: (data: Note) => void;

  readonly onNoteCreated: (listener: (data: Note) => void) => () => boolean;

  readonly settings = new RemoteJson<Settings>(
    this.store,
    'settings.json',
    DEFAULT_SETTINGS,
  );

  readonly shortcuts = new RemoteJson<Shortcuts>(
    this.store,
    'shortcuts.json',
    DEFAULT_SHORTCUTS,
  );

  constructor(private readonly store: MixedStore) {
    const [emitNoteCreate, onNoteCreated] = messageBus<Note>('note:created');
    this.emitNoteCreate = emitNoteCreate;
    this.onNoteCreated = onNoteCreated;
  }

  async all(): Promise<RemoteNote[]> {
    const pattern = getNotesPath();

    return fetchValue(
      this.store.readAllLocal(pattern),
      this.store.readAllRemote(pattern),
      x => Boolean(Object.keys(x).length),
      x => this.updateList(x),
    ).then(values =>
      Object.values(values)
        .map(x => deserialize<Note>(x))
        .map(x => this.createRemote(x.id, x)),
    );
  }

  private updateList(notes: Record<NoteId, string>) {
    for (const [, json] of Object.entries(notes)) {
      const note = deserialize<Note>(json);
      const exists = this.notes.has(note.id);
      const remote = this.note(note.id);

      remote.push(note);

      if (!exists) {
        this.emitNoteCreate(note);
      }
    }
  }

  note(id: NoteId): RemoteNote {
    if (this.notes.has(id)) {
      return this.notes.get(id)!;
    }

    // throw new Error('This should never happen');
    return this.createRemote(id, createNote(''));
  }

  create(content: NoteContent): RemoteNote {
    const note = createNote(content);
    const { id } = note;
    const remote = this.createRemote(id, note);

    Promise.all([
      this.store.write(getNotePath(id), serialize(note)),
      remote.write(content),
    ]);

    this.emitNoteCreate(note);
    return remote;
  }

  private createRemote(id: NoteId, note: Note) {
    const remote = new RemoteNote(
      id,
      new RemoteJson<Note>(this.store, getNotePath(id), note),
      new RemoteValue(this.store, getContentPath(id), ''),
    );

    this.notes.set(id, remote);
    return remote;
  }
}

function createNote(content: NoteContent): Note {
  const { group, title } = getMetadataFromContent(content);

  return {
    id: uuid() as NoteId,
    title,
    group,
    favorite: true,
    created: new Date(),
    modified: new Date(),
  };
}
