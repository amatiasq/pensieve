import './GistEditor.scss';

import React, { useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';

import { useScheduler } from '../../hooks/useScheduler';
import { useSetting } from '../../hooks/useSetting';
import { Gist } from '../../model/Gist';
import { GistFile } from '../../model/GistFile';
import { registerCommand } from '../../services/commands';
import { DEFAULT_FILE_CONTENT } from '../../services/github_api';
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
  const [isSaved, setIsSaved] = useState(true);
  const [value, setValue] = useState<string>(file.content);

  registerCommand('saveCurrentFile', () => scheduler.run());

  const scheduler = useScheduler(autosave * 1000, () => {
    if (autosave === 0) {
      return;
    }

    if (file.content !== value) {
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
    if (isSaved) setValue(file.content);
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
    setIsSaved(false);
    setValue(value || '');
    scheduler.restart();
  }

  function saveFile(file: GistFile, value: string | null) {
    if (isSaved) {
      return Promise.resolve(file);
    }

    setIsSaved(true);
    scheduler.stop();
    return file.setContent(value || DEFAULT_FILE_CONTENT);
  }
}
