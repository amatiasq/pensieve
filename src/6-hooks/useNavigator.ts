import { emitter } from '@amatiasq/emitter';
import { useHistory } from 'react-router-dom';
import { Note, NoteId } from '../2-entities/Note.ts';

const onNavigate = emitter<Navigator>();
const listeningTo = new Set();

class Navigator {
  readonly root = '/';
  readonly create = '/new';
  readonly settings = '/settings';
  readonly note = '/note/:noteId';

  get _root() {
    return preserveQueryParams(this.root);
  }
  get _create() {
    return preserveQueryParams(this.create);
  }
  get _settings() {
    return preserveQueryParams(this.settings);
  }
  get _note() {
    return preserveQueryParams(this.note);
  }
  get _path() {
    return preserveQueryParams(this.path);
  }

  constructor(
    private readonly history: ReturnType<typeof useHistory>,
    readonly path: string,
  ) {
    if (!listeningTo.has(history)) {
      history.listen(x => onNavigate(new Navigator(history, x.pathname)));
      listeningTo.add(history);
    }
  }

  readonly go = (target: string) => this._go(target);
  readonly goRoot = () => this._go(this._root);
  readonly goSettings = () => this._go(this._settings);

  private _go(target: string) {
    // history.push() doesn't trigger history.listen()
    onNavigate(new Navigator(this.history, target));
    this.history.push(target);
  }

  readonly toNote = acceptNoteOrId(id => this._note.replace(':noteId', id));

  readonly goNote = acceptNoteOrId(id =>
    this.history.push(this._note.replace(':noteId', id)),
  );

  readonly isNote = acceptNoteOrId(
    id => this.path === this.note.replace(':noteId', id),
  );

  onNavigate(listener: (next: Navigator) => void) {
    return onNavigate.subscribe(listener) as () => void;
  }

  getPageName() {
    if (this.path === '/') return 'home';
    const [, start] = this.path.split('/');
    return start;
  }
}

export function useNavigator() {
  const history = useHistory();
  return new Navigator(history, history.location.pathname);
}

function acceptNoteOrId(op: (id: NoteId) => any) {
  return (noteOrId: Note | NoteId) =>
    op(typeof noteOrId === 'string' ? noteOrId : noteOrId.id);
}

function preserveQueryParams(url: string) {
  const { search } = location;
  return search && !url.includes(search) ? `${url}${search}` : url;
}
