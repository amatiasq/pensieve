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
import { datestr, deserialize, serialize } from '../util/serialization';
import { fetchValue } from './helpers/fetchValue';
import { RemoteJson } from './helpers/RemoteJson';
import { RemoteValue } from './helpers/RemoteValue';
import { MixedStore } from './middleware/MixedStore';
import { RemoteNote } from './RemoteNote';

const getNotesPath = () => 'meta/*';
const getNotePath = (id: NoteId) => `meta/${id}.json`;
const getContentPath = (id: NoteId) => `note/${id}`;
const cleanJson = (json: string) => json.trim().replace(/,$/, '');

export class NotesStorage {
  private readonly notes = new Map<NoteId, RemoteNote>();
  private readonly emitNotesCreate: (data: Note[]) => void;
  readonly onNotesCreated: (listener: (data: Note[]) => void) => () => void;

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
    const [emitNotesCreate, onNotesCreated] =
      messageBus<Note[]>('notes-created');
    this.emitNotesCreate = emitNotesCreate;
    this.onNotesCreated = onNotesCreated;
  }

  async all() {
    const pattern = getNotesPath();

    return fetchValue(
      this.store.readAllLocal(pattern),
      this.store.readAllRemote(pattern),
      x => Boolean(Object.keys(x).length),
      x => this.updateList(x),
    ).then(values =>
      Object.values(values).map(raw => {
        const note = deserialize<Note>(cleanJson(raw));
        this.updateRemote(note.id, note);
        return note;
      }),
    );
  }

  private updateList(notes: Record<NoteId, string>) {
    const toBeAdded = [];

    for (const [, json] of Object.entries(notes)) {
      const note = deserialize<Note>(cleanJson(json));
      const exists = this.notes.has(note.id);
      const remote = this.note(note.id);

      remote.push(note);

      if (!exists) {
        toBeAdded.push(note);
      }
    }

    if (toBeAdded.length) {
      this.emitNotesCreate(toBeAdded);
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

    this.emitNotesCreate([note]);
    return remote;
  }

  private updateRemote(id: NoteId, note: Note) {
    if (!this.notes.get(id)) {
      return this.createRemote(id, note);
    }

    const remote = this.notes.get(id)!;
    remote.push(note);
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
    created: datestr(),
    modified: datestr(),
  };
}
