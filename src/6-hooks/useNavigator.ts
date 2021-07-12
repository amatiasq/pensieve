import { useHistory } from 'react-router-dom';

import { Note, NoteId } from '../2-entities/Note';

class Navigator {
  readonly root = '/';
  readonly create = '/new';
  readonly settings = '/settings';
  readonly note = '/note/:noteId';

  constructor(
    private readonly history: ReturnType<typeof useHistory>,
    readonly path: string,
  ) {}

  readonly goRoot = () => this.history.push(this.root);
  readonly goSettings = () => this.history.push(this.settings);

  readonly toNote = acceptNoteOrId(id => this.note.replace(':noteId', id));

  readonly goNote = acceptNoteOrId(id =>
    this.history.push(this.note.replace(':noteId', id)),
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
