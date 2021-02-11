import './GistEditor.scss';

import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { useScheduler } from '../../hooks/useScheduler';
import { useSetting } from '../../hooks/useSetting';
import { Gist } from '../../model/Gist';
import { GistFile } from '../../model/GistFile';
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

  const scheduler = useScheduler(autosave * 1000, () => {
    if (autosave === 0) {
      return;
    }

    if (!isSaved && file.content !== value) {
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
    window.addEventListener('keydown', event => {
      if (event.metaKey && event.key === 's') {
        event.preventDefault();
        scheduler.run();
      }
    });
  }, []);

  if (value == null) return <p>Loading...</p>;

  return (
    <main className={`gist-editor ${readonly ? 'readonly' : ''}`}>
      <EditorTabs
        gist={gist}
        active={file}
        readonly={readonly}
        onChange={onFileChange}
      />
      <ContentEditor
        file={file}
        value={value}
        readonly={readonly}
        onChange={onChange}
      />
    </main>
  );

  function onFileChange(newFile: GistFile) {
    if (!isSaved && value != null) {
      saveFile(file, value);
      scheduler.stop();
    }

    history.push(`/gist/${gist.id}/${newFile.name}`);
  }

  function onChange(value?: string) {
    setIsSaved(false);
    setValue(value || '');
    scheduler.restart();
  }

  function saveFile(file: GistFile, value: string | null) {
    const content = value || "Don't leave this empty";
    setIsSaved(true);
    return file.setContent(content);
  }
}
