import './GistEditor.scss';

import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { registerCommand } from '../../1-core/commands';
import { DEFAULT_FILE_CONTENT } from '../../2-github/github_api';
import { Gist } from '../../3-gist/Gist';
import { GistFile } from '../../3-gist/GistFile';
import { useScheduler } from '../../6-hooks/useScheduler';
import { useSetting } from '../../6-hooks/useSetting';
import { useStack } from '../../6-hooks/useStack';
import { BusinessIndicator } from '../atoms/BusinessIndicator';
import { ContentEditor } from './ContentEditor';
import { EditorTabs } from './EditorTabs';

export function GistEditor({
  gist,
  file,
  readonly,
}: {
  gist: Gist;
  file: GistFile;
  readonly?: boolean;
}) {
  const history = useHistory();
  const autosave = useSetting('autosave')[0] || 0;
  const [saved, addSaved] = useStack<string>(5, file.content);
  const [value, setValue] = useState<string>(file.content);

  registerCommand('saveCurrentFile', () => saveFile(file, value));

  const scheduler = useScheduler(autosave * 1000, () => {
    if (autosave !== 0 && file.content !== value) {
      saveFile(file, value);
    }
  });

  useEffect(() => {
    if (file) {
      // eslint-disable-next-line no-irregular-whitespace
      document.title = `${file.name}  ✏️  Gists`;
    }

    setValue(file.content);
  }, [file.name]);

  useEffect(() => {
    if (value !== file.content && !saved.includes(file.content)) {
      setValue(file.content);
    }
  }, [file.content]);

  useEffect(() => {
    const handler = () => saveFile(file, value);
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  });

  useEffect(() =>
    history.listen(x => {
      if (x.pathname !== file.path) {
        saveFile(file, value);
      }
    }),
  );

  if (value == null) return <p>Loading...</p>;

  return (
    <main className={`gist-editor ${readonly ? 'readonly' : ''}`}>
      <EditorTabs gist={gist} active={file} readonly={readonly} />
      <ContentEditor
        key={file.name}
        file={file}
        value={value === DEFAULT_FILE_CONTENT ? '' : value}
        readonly={readonly}
        onChange={onChange}
      />
      <BusinessIndicator />
    </main>
  );

  function onChange(value?: string) {
    setValue(value || '');
    scheduler.restart();
  }

  function saveFile(file: GistFile, value: string | null) {
    scheduler.stop();
    const content = value || DEFAULT_FILE_CONTENT;
    addSaved(content);
    return file.setContent(content);
  }
}
