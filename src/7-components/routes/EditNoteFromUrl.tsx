import { useParams } from 'react-router-dom';
import { NoteId } from '../../2-entities/Note.ts';
import { useNavigator } from '../../6-hooks/useNavigator.ts';
import { useNote } from '../../6-hooks/useNote.ts';
import { useNoteContent } from '../../6-hooks/useNoteContent.ts';
import { Loader } from '../atoms/Loader.tsx';
import { Editor } from '../Editor/Editor.tsx';

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
