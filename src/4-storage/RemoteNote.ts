import { messageBus } from '../1-core/messageBus';
import {
  getMetadataFromContent,
  isNoteIdentical,
  Note,
  NoteContent,
  NoteId
} from '../2-entities/Note';
import { datestr, isDeserializable } from '../util/serialization';
import { MemoryCache } from './helpers/MemoryCache';
import { RemoteJson } from './helpers/RemoteJson';
import { RemoteValue } from './helpers/RemoteValue';
import { WriteOptions } from './helpers/WriteOptions';

const noop = () => {
  // noop
};

const cache = new Map<NoteId, Note>();

export class RemoteNote {
  private readonly emitChange: (data: Note) => void;
  private readonly emitContentChange: (data: string) => void;
  private readonly emitDelete: (data: void) => void;
  private readonly emitDraft: (data: Note) => void;
  readonly onChange: (listener: (data: Note) => void) => () => void;
  readonly onContentChange: (listener: (data: string) => void) => () => void;
  readonly onDelete: (listener: (data: void) => void) => () => void;
  readonly onDraft: (listener: (data: Note) => void) => () => boolean;

  constructor(
    readonly id: NoteId,
    private readonly meta: RemoteJson<Note>,
    private readonly content: RemoteValue,
  ) {
    const [emitDraft, onDraft] = messageBus<Note>(`note:title:${id}`);
    const [emitDelete, onDelete] = messageBus<void>(`note:deleted:${id}`);
    const [emitChange, onChange] = messageBus<Note>(`note:changed:${id}`);
    const [emitContentChange, onContentChange] = messageBus<NoteContent>(
      `note:content-changed:${id}`,
    );

    this.emitChange = emitChange;
    this.emitContentChange = emitContentChange;
    this.emitDelete = emitDelete;
    this.emitDraft = emitDraft;
    this.onChange = onChange;
    this.onContentChange = onContentChange;
    this.onDelete = onDelete;
    this.onDraft = onDraft;
  }

  private getCache() {
    return cache.get(this.id) || null;
  }

  get(): Note | null {
    const cached = this.getCache();

    this.meta.get().then(x => {
      if (!isNoteIdentical(cached, x)) {
        cache.set(this.id, x);
        this.emitChange(x);
      }
    });

    return cached;
  }

  async delete(options?: WriteOptions): Promise<void> {
    await Promise.all([
      this.meta.delete(options).catch(noop),
      this.content.delete(options).catch(noop),
    ]);

    this.emitDelete();
  }

  draft(draft: NoteContent) {
    const current = this.getCache();
    if (!current) return;
    const { title, group } = getMetadataFromContent(draft);
    this.emitDraft({ ...current, title, group });
  }

  read() {
    return this.content.read();
  }

  async write(value: NoteContent, options?: WriteOptions) {
    const { title, group } = getMetadataFromContent(value);

    await Promise.all([
      this.update(x => ({ ...x, title, group, modified: datestr() }), options),
      this.content.write(value, options),
    ]);

    this.emitContentChange(value);
  }

  setGroup(group: string, options?: WriteOptions): Promise<Note> {
    return this.update(x => ({ ...x, group }), options);
  }

  toggleFavorite(options?: WriteOptions): Promise<Note> {
    return this.update(x => ({ ...x, favorite: !x.favorite }), options);
  }

  async push(note: Note) {
    const { id } = this;
    const hasChanged = !isNoteIdentical(this.getCache(), note);

    cache.set(id, note);

    if (hasChanged) {
      this.emitChange(note);
    }
  }

  private async update(operator: (x: Note) => Note, options?: WriteOptions) {
    const meta = await this.meta.get();
    const updated = operator(meta);

    if (
      !isNoteIdentical(
        { ...meta, modified: new Date(0) },
        { ...updated, modified: new Date(0) },
      )
    ) {
      await this.meta.set(updated, options);
      this.emitChange(updated);
    }

    return updated;
  }
}
