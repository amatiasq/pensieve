import { useHistory } from 'react-router-dom';
import { Note, NoteId } from '../2-entities/Note';

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
  ) {}

  readonly go = (target: string) => this.history.push(target);
  readonly goRoot = () => this.history.push(this._root);
  readonly goSettings = () => this.history.push(this._settings);

  readonly toNote = acceptNoteOrId(id => this._note.replace(':noteId', id));

  readonly goNote = acceptNoteOrId(id =>
    this.history.push(this._note.replace(':noteId', id)),
  );

  readonly isNote = acceptNoteOrId(
    id => this.path === this.note.replace(':noteId', id),
  );

  onNavigate(listener: (next: Navigator) => void) {
    return this.history.listen(x =>
      listener(new Navigator(this.history, x.pathname)),
    );
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
