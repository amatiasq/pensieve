import './EditorTabs.scss';

import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';

import { Gist } from '../../model/Gist';
import { GistFile } from '../../model/GistFile';
import { getSettingsGist } from '../../services/settings';
import { Action } from '../atoms/Action';
import { BackButton } from '../atoms/BackButton';
import { FileTab } from './FileTab';

export let requestNewFile: () => void = () => undefined;

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

  requestNewFile = () => !readonly && setNewFileName('Filename.md');
  (window as any).requestNewFile = requestNewFile;

  return (
    <nav className="editor-tabs">
      <BackButton />

      <div className="editor-tabs--files">
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
            onClick={requestNewFile}
          />
        ) : (
          <FileTab onSubmit={addFile} onAbort={() => setNewFileName(null)} />
        )}
      </div>

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
