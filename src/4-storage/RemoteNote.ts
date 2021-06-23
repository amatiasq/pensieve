import { messageBus } from '../1-core/messageBus';
import {
  getMetadataFromContent,
  isNoteIdentical,
  Note,
  NoteContent,
  NoteId
} from '../2-entities/Note';
import { datestr } from '../util/serialization';
import { RemoteJson } from './helpers/RemoteJson';
import { RemoteValue } from './helpers/RemoteValue';
import { WriteOptions } from './helpers/WriteOptions';

const noop = () => {
  // noop
};

const cache = new Map<NoteId, Note>();

export function isIdValid(id: NoteId) {
  return cache.has(id);
}

export class RemoteNote {
  private readonly emitChange: (data: Note) => void;
  private readonly emitContentChange: (data: NoteContent) => void;
  private readonly emitDelete: (data: void) => void;
  private readonly emitDraft: (data: Note) => void;
  readonly onChange: (listener: (data: Note) => void) => () => void;
  readonly onContentChange: (
    listener: (data: NoteContent) => void,
  ) => () => void;
  readonly onDelete: (listener: (data: void) => void) => () => void;
  readonly onDraft: (listener: (data: Note) => void) => () => void;

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

    if (cache.has(id)) {
      throw new Error(`Created RemoteNote twice with same id: ${id}`);
    }

    // this.emitChange = (x: any) => {
    //   if (!isIdValid(x.id)) debugger;
    //   emitChange(x);
    // };

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

  async read() {
    const wasSavedUrgently = localStorage.getItem('URGENT_SAVE') === this.id;

    if (wasSavedUrgently) {
      localStorage.removeItem('URGENT_SAVE');
      await new Promise(x => setTimeout(x, 500));
    }

    const content = (await this.content.read()) || '';
    this.updateFromContent(content);
    return content;
  }

  async write(value: NoteContent, options?: WriteOptions) {
    if (options && options.urgent) {
      localStorage.setItem('URGENT_SAVE', this.id);
    }

    await Promise.all([
      this.updateFromContent(value, options),
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

    if (note.id !== id) {
      throw new Error(
        `Pushing note with id ${note.id} into RemoteNote with id ${id}`,
      );
    }

    const hasChanged = !isNoteIdentical(this.getCache(), note);

    cache.set(id, note);

    if (hasChanged) {
      this.emitChange(note);
    }
  }

  private async update(operator: (x: Note) => Note, options?: WriteOptions) {
    const meta = await this.meta.get();
    const updated = operator(meta);
    const modified = datestr();

    if (!isNoteIdentical({ ...meta, modified }, { ...updated, modified })) {
      await this.meta.set(updated, options);
      this.emitChange(updated);
    }

    return updated;
  }

  private updateFromContent(content: NoteContent, options?: WriteOptions) {
    const { title, group } = getMetadataFromContent(content);

    return this.update(
      x => ({ ...x, title, group, modified: datestr() }),
      options,
    );
  }
}
