import './EditGist.scss';

import React, { useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';

import { GistId } from '../../contracts/type-aliases';
import { useGist } from '../../hooks/useGist';
import { useScheduler } from '../../hooks/useScheduler';
import { Gist } from '../../model/Gist';
import { GistFile } from '../../model/GistFile';
import { ContentEditor } from './ContentEditor';
import { EditorTabs } from './EditorTabs';

const DELAY = 5;

export function EditGist() {
  const { gistId, filename } = useParams() as { [key: string]: string };
  const gist = useGist(gistId as GistId);
  const file = gist ? gist.getFile(filename) || gist.files[0] : null;

  if (!gist || !file || !file.content) {
    return <p>Loading...</p>;
  }

  return <GistEditor gist={gist} file={file} />;
}

function GistEditor({ gist, file }: { gist: Gist; file: GistFile }) {
  const history = useHistory();
  const [isSaved, setIsSaved] = useState(true);
  const [value, setValue] = useState<string>(file.content);

  const scheduler = useScheduler(DELAY * 1000, () => {
    if (!isSaved && file.content !== value) {
      saveFile(file, value);
    }
  });

  useEffect(() => {
    if (file) {
      document.title = `${gist.date} ${file.name} | Gists`;
    }

    setValue(file.content);
  }, [file]);

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
    <div className="editor">
      <EditorTabs files={gist.files} active={file} onChange={onFileChange} />
      <ContentEditor file={file} value={value} onChange={onChange} />
    </div>
  );

  function onFileChange(newFile: GistFile) {
    if (!isSaved && value != null) {
      saveFile(file, value);
      scheduler.stop();
    }

    history.push(`/${gist.id}/${newFile.name}`);
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
