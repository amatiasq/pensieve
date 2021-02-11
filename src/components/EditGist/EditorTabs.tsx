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
  readonly,
  onChange,
}: {
  gist: Gist;
  active: GistFile;
  readonly?: boolean;
  onChange: (file: GistFile) => void;
}) {
  const settings = getSettingsGist();
  const history = useHistory();
  const [newFileName, setNewFileName] = useState<string | null>(null);

  return (
    <nav className="editor-tabs">
      <Action
        name="editor-tabs--back"
        icon="chevron-left"
        navigate="/"
        square
      />

      {gist.files.map(file => (
        <FileTab
          key={file.name}
          file={file}
          isActive={file === active}
          readonly={readonly}
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
        {/* <Action
          name="editor-tabs--fav"
          icon={gist.isStarred ? 'star' : 'far star'}
          onClick={gist.toggleStar()}
        /> */}

        <Action
          name="editor-tabs--commments"
          icon="comment-alt"
          target="_blank"
          href={gist.commentsUrl}
        >
          <span className="editor-tabs--comment-count">
            {gist.commentCount}
          </span>
        </Action>

        <Action
          name="editor-tabs--github"
          icon="fab github"
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
