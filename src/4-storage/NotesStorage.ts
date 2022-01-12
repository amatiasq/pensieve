import { v4 as uuid } from 'uuid';
import { messageBus } from '../1-core/messageBus';
import {
  getMetadataFromContent,
  Note,
  NoteContent,
  NoteId,
} from '../2-entities/Note';
import { DEFAULT_SETTINGS, Settings } from '../2-entities/Settings';
import { DEFAULT_SHORTCUTS, Shortcuts } from '../2-entities/Shortcuts';
import { datestr, deserialize, serialize } from '../util/serialization';
import { fetchAndUpdate } from './helpers/fetchAndUpdate';
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
    const log = (key: string) => (result: Record<string, string>) => {
      console.log(`Notes found in ${key}`, Object.keys(result).length);
      return result;
    };

    return fetchAndUpdate(
      this.store.readAllLocal(pattern).then(log('local')),
      this.store.readAllRemote(pattern).then(log('remote')),
      x => this.synchronize(x),
      x => Boolean(Object.keys(x).length),
    ).then(values =>
      Object.values(values).map(raw => {
        const note = deserialize<Note>(cleanJson(raw));
        this.updateRemote(note.id, note);
        return note;
      }),
    );
  }

  private synchronize(notes: Record<NoteId, string>) {
    const toBeAdded = [];
    const existing = new Set<NoteId>(...(this.notes.keys() as any));

    for (const [, json] of Object.entries(notes)) {
      const note = deserialize<Note>(cleanJson(json));
      const exists = existing.delete(note.id);
      const remote = this.note(note.id);

      remote.push(note);

      if (!exists) {
        toBeAdded.push(note);
      }
    }

    if (toBeAdded.length) {
      this.emitNotesCreate(toBeAdded);
    }

    for (const id of existing) {
      this.store.deleteLocal(getNotePath(id));
      this.store.deleteLocal(getContentPath(id));
    }
  }

  note(id: NoteId): RemoteNote {
    if (this.notes.has(id)) {
      return this.notes.get(id)!;
    }

    // throw new Error('This should never happen');
    return this.createRemote(id, { ...createNote(''), id });
  }

  create(content: NoteContent): RemoteNote {
    const note = createNote(content);
    const { id } = note;
    const remote = this.createRemote(id, note);
    const reason = `Create note "${note.title}"`;

    Promise.all([
      this.store.write(getNotePath(id), serialize(note), { reason }),
      remote.write(content, { reason }),
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
    remote.push(note);
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
