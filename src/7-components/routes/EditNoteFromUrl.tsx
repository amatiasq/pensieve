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

// El editor y sus hooks guardan estado por nota, así que la nota es su `key`:
// sin ella el render que sigue a la navegación pinta el texto de la anterior con
// el `onSave` de la nueva, y lo que estuviera por guardar cae en la nota que no
// es.
export function EditNoteFromUrl() {
  const { noteId } = useParams() as { noteId: NoteId };
  return <NoteEditor key={noteId} id={noteId} />;
}

function NoteEditor({ id }: { id: NoteId }) {
  const navigator = useNavigator();
  const [note, { loading, draft }] = useNote(id);
  const [content, setContent, contentLoading, contentError] =
    useNoteContent(id);

  if (loading) {
    return <Loader />;
  }

  if (!note) {
    console.error(`Note ${id} not found`);
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
      key={id}
      title={note.title}
      content={content}
      onChange={draft}
      onSave={setContent}
    />
  );
}
