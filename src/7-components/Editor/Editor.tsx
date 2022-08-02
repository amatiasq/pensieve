import { emitter } from '@amatiasq/emitter';
import styled from '@emotion/styled';
import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { debounceTime, map, mergeWith } from 'rxjs/operators';
import { onPageActive } from '../../0-dom/page-lifecycle';
import { useScheduler } from '../../6-hooks/useScheduler';
import { useSetting } from '../../6-hooks/useSetting';
import { useShortcut } from '../../6-hooks/useShortcut';
import { useStack } from '../../6-hooks/useStack';
import { fromEmitter } from '../../util/rxjs-extensions';
import { BusinessIndicator } from '../atoms/BusinessIndicator';
import { Loader } from '../atoms/Loader';
import { MonacoEditor } from './MonacoEditor';

interface BaseEditorProps {
  key: string;
  title: string;
  content: string;
  ext?: string;
  gap?: string;
}

type ReadonlyEditorProps = BaseEditorProps & { readonly: true };
type EditableEditorProps = BaseEditorProps & {
  saveOnNavigation?: boolean;
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
  const requestSave = emitter<void>();
  const requestUrgentSave = emitter<void>();

  const history = useHistory();
  const autosave = useSetting('autosave')[0] || 0;
  const [saved, addSaved] = useStack<string>(5, content);
  const [hasUnsavedChanges, setHasUnsavedChanged] = useState(false);
  const [value, setValue] = useState<string>(content);

  const scheduler = useScheduler(autosave * 1000, () => {
    if (autosave !== 0) {
      requestSave();
    }
  });

  useShortcut('save', forceSave);

  useEffect(() => {
    // eslint-disable-next-line no-irregular-whitespace
    document.title = `${title}  ✏️  Pensieve`;
  }, [title]);

  useEffect(() => {
    if (isEditable(props) && props.saveOnNavigation) {
      return history.listen(() => requestSave());
    }
  });

  useEffect(() => {
    if (!saved.includes(content)) {
      setHasUnsavedChanged(false);
      setValue(content);
    }
  }, [content]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const sus = onPageActive.subscribe(active => {
      if (!active) requestUrgentSave();
    });

    return () => sus.unsubscribe();
  });

  if (value == null) return <Loader />;

  const urgent = fromEmitter(requestUrgentSave).pipe(
    map(() => ({ urgent: true })),
  );

  fromEmitter(requestSave)
    .pipe(debounceTime(100), mergeWith(urgent))
    .subscribe(options => hasUnsavedChanges && forceSave(options || {}));

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
    props.onChange && props.onChange(value);
    scheduler.restart();
  }

  function forceSave({ urgent = false } = {}) {
    if (!hasUnsavedChanges) {
      console.warn('Possibly creating an empty commit!');
    }

    if (!isEditable(props)) wtf();
    scheduler.stop();
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
