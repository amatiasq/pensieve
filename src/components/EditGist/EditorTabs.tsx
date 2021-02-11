import './EditorTabs.scss';

import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';

import { Gist } from '../../model/Gist';
import { GistFile } from '../../model/GistFile';
import { getSettingsGist } from '../../services/settings';
import { Action } from '../Action';
import { FileTab } from './FileTab';

export function EditorTabs({
  gist,
  active,
  onChange,
}: {
  gist: Gist;
  active: GistFile;
  onChange: (file: GistFile) => void;
}) {
  const settings = getSettingsGist();
  const history = useHistory();
  const [newFileName, setNewFileName] = useState<string | null>(null);

  return (
    <nav className="editor-tabs">
      <Action
        name="editor-tabs--back-button"
        icon="chevron-left"
        navigate="/"
      />

      {gist.files.map(file => (
        <FileTab
          key={file.name}
          file={file}
          isActive={file === active}
          onSelect={onChange}
          onRename={name => file.rename(name)}
        />
      ))}

      {newFileName == null ? (
        <Action
          name="editor-tabs--new-file"
          icon="plus"
          onClick={() => setNewFileName('Filename.md')}
        />
      ) : (
        <FileTab onSubmit={addFile} onAbort={() => setNewFileName(null)} />
      )}

      <div className="spacer"></div>

      <div className="editor-tabs--actions">
        <Action
          name="editor-tabs--gh-link"
          icon="github"
          target="_blank"
          href={gist.htmlUrl}
        />

        {settings && (
          <Action
            name="editor-tabs--settings"
            icon="cog"
            navigate={`/gist/${settings.id}/${settings.filename}`}
          />
        )}
      </div>
    </nav>
  );

  function addFile(name: string) {
    setNewFileName(null);

    return gist.addFile(name).then(x => {
      const file = x.getFileByName(name) as GistFile;
      history.push(file.path);
      return file;
    });
  }
}
