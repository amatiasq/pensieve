import { emitter } from '@amatiasq/emitter';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Note, NoteId } from '../2-entities/Note.ts';

const onNavigate = emitter<Navigator>();

let currentNavigator: Navigator | null = null;

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
    private readonly navigate: ReturnType<typeof useNavigate>,
    readonly path: string,
  ) {}

  readonly go = (target: string) => this._go(target);
  readonly goRoot = () => this._go(this._root);
  readonly goSettings = () => this._go(this._settings);

  private _go(target: string) {
    onNavigate(new Navigator(this.navigate, target));
    this.navigate(target);
  }

  readonly toNote = acceptNoteOrId(id => this._note.replace(':noteId', id));

  readonly goNote = acceptNoteOrId(id =>
    this.navigate(this._note.replace(':noteId', id)),
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
  const navigate = useNavigate();
  const location = useLocation();
  const nav = new Navigator(navigate, location.pathname);

  useEffect(() => {
    if (currentNavigator?.path !== location.pathname) {
      currentNavigator = nav;
      onNavigate(nav);
    }
  }, [location.pathname]);

  return nav;
}

function acceptNoteOrId(op: (id: NoteId) => any) {
  return (noteOrId: Note | NoteId) =>
    op(typeof noteOrId === 'string' ? noteOrId : noteOrId.id);
}

function preserveQueryParams(url: string) {
  const { search } = location;
  return search && !url.includes(search) ? `${url}${search}` : url;
}
