import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { useScheduler } from '../../6-hooks/useScheduler';
import { useSetting } from '../../6-hooks/useSetting';
import { useShortcut } from '../../6-hooks/useShortcut';
import { useStack } from '../../6-hooks/useStack';
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

export type EditorProps = ReadonlyEditorProps | EditableEditorProps;

export function Editor(props: EditorProps) {
  const { title, content, ext, gap } = props;
  const readonly = isReadonly(props) || false;

  const history = useHistory();
  const autosave = useSetting('autosave')[0] || 0;
  const [saved, addSaved] = useStack<string>(5, content);
  const [value, setValue] = useState<string>(content);

  const scheduler = useScheduler(autosave * 1000, () => {
    if (autosave !== 0) {
      save();
    }
  });

  useShortcut('save', forceSave);

  useEffect(() => {
    if (isEditable(props) && props.saveOnNavigation) {
      history.listen(() => save());
    }
  });

  useEffect(() => {
    // eslint-disable-next-line no-irregular-whitespace
    document.title = `${title}  ✏️  Notes`;
  }, [title]);

  useEffect(() => {
    if (!saved.includes(content)) {
      setValue(content);
    }
  }, [content]);

  useEffect(() => {
    const handler = () => save(true);
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  });

  if (value == null) return <Loader />;

  return (
    <main>
      <MonacoEditor
        {...{ ext, gap, value, readonly }}
        onChange={onEditorChange}
      />
      <BusinessIndicator />
    </main>
  );

  function onEditorChange(value = '') {
    if (!isEditable(props)) return;
    const { onChange } = props;
    setValue(value);
    onChange && onChange(value);
    scheduler.restart();
  }

  function save(urgent = false) {
    if (value !== content) {
      forceSave(urgent);
    }
  }

  function forceSave(urgent = false) {
    if (!isEditable(props)) return;
    scheduler.stop();
    addSaved(value);
    const { onSave } = props;
    return onSave(value, { urgent });
  }
}

function isReadonly(props: EditorProps): props is ReadonlyEditorProps {
  return 'readonly' in props;
}

function isEditable(props: EditorProps): props is EditableEditorProps {
  return 'onSave' in props;
}
