import './EditorTabs.scss';

import React, { useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';

import { DEFAULT_FILE_NAME, Gist } from '../../model/Gist';
import { GistFile } from '../../model/GistFile';
import { registerCommand } from '../../services/commands';
import { useStar } from '../../services/gist/starred';
import { getSettingsGist } from '../../services/settings';
import { Action } from '../atoms/Action';
import { BackButton } from '../BackButton';
import { FileTab } from './FileTab';

export function EditorTabs({
  gist,
  active,
  readonly,
}: {
  gist: Gist;
  active: GistFile;
  readonly?: boolean;
}) {
  const { filename } = useParams() as { [key: string]: string };
  const settings = getSettingsGist();
  const history = useHistory();
  const isStarred = useStar(gist.id);

  const [newFileName, setNewFileName] = useState<string | null>(null);

  useEffect(() => {
    setNewFileName(filename === active.name ? null : filename);
  }, [filename, active.name]);

  const settingsUrl = settings
    ? `/gist/${settings.id}/${settings.filename}`
    : null;

  if (settingsUrl) {
    registerCommand('settings', () => history.push(settingsUrl));
  }

  registerCommand(
    'createFile',
    () => !readonly && history.push(gist.createFilePath),
  );

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
            onRename={name => file.rename(name)}
          />
        ))}

        {newFileName == null ? (
          <Action
            name="editor-tabs--new-file"
            icon="plus"
            disabled={readonly}
            navigate={gist.createFilePath}
          />
        ) : (
          <FileTab
            name={newFileName}
            onSubmit={addFile}
            onAbort={() => setNewFileName(null)}
          />
        )}
      </div>

      <div className="editor-tabs--actions">
        <Action
          name="editor-tabs--fav"
          icon={isStarred ? 'star' : 'far star'}
          onClick={() => gist.toggleStar()}
        />

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

        {settingsUrl && (
          <Action
            name="editor-tabs--settings"
            icon="cog"
            navigate={settingsUrl}
          />
        )}
      </div>
    </nav>
  );

  function addFile(name: string) {
    setNewFileName(null);

    if (name === DEFAULT_FILE_NAME) {
      return;
    }

    return gist.addFile(name).then(x => {
      const file = x.getFileByName(name) as GistFile;
      history.push(file.path);
      return file;
    });
  }
}
