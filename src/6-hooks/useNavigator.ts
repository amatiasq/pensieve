import { useHistory } from 'react-router-dom';

import { Note, NoteId } from '../2-entities/Note';

const note = '/note/:noteId';

class Navigator {
  readonly note = '/note/:noteId';
  constructor(
    private readonly history: ReturnType<typeof useHistory>,
    readonly path: string,
  ) {}

  readonly toNote = acceptNoteOrId(id => note.replace(':noteId', id));

  readonly goNote = acceptNoteOrId(id =>
    this.history.push(note.replace(':noteId', id)),
  );

  readonly isNote = acceptNoteOrId(
    id => this.path === note.replace(':noteId', id),
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
