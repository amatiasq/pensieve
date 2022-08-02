import { useParams } from 'react-router-dom';
import { NoteId } from '../../2-entities/Note';
import { useNavigator } from '../../6-hooks/useNavigator';
import { useNote } from '../../6-hooks/useNote';
import { useNoteContent } from '../../6-hooks/useNoteContent';
import { Loader } from '../atoms/Loader';
import { Editor } from '../Editor/Editor';

export function EditNoteFromUrl() {
  const { noteId } = useParams() as { noteId: NoteId };
  const navigator = useNavigator();
  const [note, { loading, draft }] = useNote(noteId);
  const [content, setContent] = useNoteContent(noteId);

  if (loading) {
    return <Loader />;
  }

  if (!note) {
    console.error(`Note ${noteId} not found`);
    navigator.goRoot();
    return null;
  }

  return (
    <Editor
      key={note.id}
      title={note.title}
      content={content}
      saveOnNavigation
      onChange={draft}
      onSave={setContent}
    />
  );
}
