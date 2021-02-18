import './EditorTabs.scss';

import React from 'react';
import { useHistory } from 'react-router-dom';

import { Gist } from '../../model/Gist';
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
  const settings = getSettingsGist();
  const history = useHistory();
  const isStarred = useStar(gist.id);

  const settingsUrl = settings
    ? `/gist/${settings.id}/${settings.filename}`
    : null;

  if (settingsUrl) {
    registerCommand('settings', () => history.push(settingsUrl));
  }

  const createFile = () =>
    !readonly && gist.addFile().then(file => history.push(file.path));

  registerCommand('createFile', createFile);

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

        <Action
          name="editor-tabs--new-file"
          icon="plus"
          disabled={readonly}
          onClick={createFile}
        />
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

  // function addFile(name: string) {
  //   setNewFileName(null);

  //   if (name === DEFAULT_FILE_NAME) {
  //     return;
  //   }

  //   return gist.addFile(name).then(x => {
  //     const file = x.getFileByName(name) as GistFile;
  //     history.push(file.path);
  //     return file;
  //   });
  // }
}
