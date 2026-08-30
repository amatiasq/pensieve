import styled from '@emotion/styled';
import { useEffect, useState } from 'react';
import { useAutosave } from '../../6-hooks/useAutosave.ts';
import { usePageTitle } from '../../6-hooks/usePageTitle.ts';
import { useStack } from '../../6-hooks/useStack.ts';
import { BusinessIndicator } from '../atoms/BusinessIndicator.tsx';
import { Loader } from '../atoms/Loader.tsx';
import { MonacoEditor } from './MonacoEditor.tsx';

interface BaseEditorProps {
  key: string;
  title: string;
  content: string;
  ext?: string;
  gap?: string;
}

type ReadonlyEditorProps = BaseEditorProps & { readonly: true };
type EditableEditorProps = BaseEditorProps & {
  onChange?(unsaved: string): void;
  onSave(newValue: string, options: { urgent: boolean }): void;
};

const EditorContainer = styled.div`
  grid-area: editor;
`;

export type EditorProps = ReadonlyEditorProps | EditableEditorProps;

export function Editor(props: EditorProps) {
  const { title, content, ext, gap } = props;
  const readonly = isReadonly(props) || false;

  const updateTitle = usePageTitle();
  const [saved, addSaved] = useStack<string>(5, content);
  const [hasUnsavedChanges, setHasUnsavedChanged] = useState(false);
  const [value, setValue] = useState<string>(content);

  const { onUserEdit } = useAutosave({ hasUnsavedChanges, save: forceSave });

  useEffect(() => {
    updateTitle(title);
  }, [title]);

  useEffect(() => {
    if (!saved.includes(content)) {
      setHasUnsavedChanged(false);
      setValue(content);
    }
  }, [content]);

  if (value == null) return <Loader />;

  return (
    <EditorContainer>
      <MonacoEditor
        {...{ ext, gap, value, readonly }}
        onChange={onEditorChange}
      />
      <BusinessIndicator />
    </EditorContainer>
  );

  function onEditorChange(value = '') {
    if (!isEditable(props)) wtf();
    setHasUnsavedChanged(value !== content);
    setValue(value);
    props.onChange?.(value);
    onUserEdit();
  }

  function forceSave({ urgent = false } = {}) {
    if (!hasUnsavedChanges) {
      console.warn('Possibly creating an empty commit!');
    }

    if (!isEditable(props)) wtf();
    addSaved(value);
    const formatted = format(value);
    addSaved(formatted);
    setHasUnsavedChanged(false);
    return props.onSave(formatted, { urgent });
  }
}

function format(value: string) {
  const trimmed = value.replace(/ +\n| +$/g, '\n');

  if (trimmed[trimmed.length - 1] === '\n') {
    return trimmed;
  }

  return `${trimmed}\n`;
}

function isReadonly(props: EditorProps): props is ReadonlyEditorProps {
  return 'readonly' in props;
}

function isEditable(props: EditorProps): props is EditableEditorProps {
  return 'onSave' in props;
}

function wtf(): never {
  throw new Error('How the fuck did you get here???');
}
