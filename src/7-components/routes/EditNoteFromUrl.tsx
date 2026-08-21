import styled from '@emotion/styled';
import { useParams } from 'react-router-dom';
import { NoteId } from '../../2-entities/Note.ts';
import { useNavigator } from '../../6-hooks/useNavigator.ts';
import { useNote } from '../../6-hooks/useNote.ts';
import { useNoteContent } from '../../6-hooks/useNoteContent.ts';
import { Loader } from '../atoms/Loader.tsx';
import { Editor } from '../Editor/Editor.tsx';

const ReadError = styled.div`
  grid-area: editor;
  padding: 2em;
  line-height: 1.6;

  code {
    opacity: 0.7;
  }
`;

export function EditNoteFromUrl() {
  const { noteId } = useParams() as { noteId: NoteId };
  const navigator = useNavigator();
  const [note, { loading, draft }] = useNote(noteId);
  const [content, setContent, contentLoading, contentError] =
    useNoteContent(noteId);

  if (loading) {
    return <Loader />;
  }

  if (!note) {
    console.error(`Note ${noteId} not found`);
    navigator.goRoot();
    return null;
  }

  // Un editor vacío se lee como «la nota está vacía», y guardar encima de eso se
  // la lleva por delante. Mientras no haya contenido no hay editor.
  if (contentError) {
    return (
      <ReadError>
        <p>No se ha podido leer «{note.title}».</p>
        <p>
          <code>{contentError.message}</code>
        </p>
      </ReadError>
    );
  }

  if (contentLoading) {
    return <Loader />;
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
