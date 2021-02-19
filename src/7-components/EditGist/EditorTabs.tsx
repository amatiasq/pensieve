import './EditorTabs.scss';

import React from 'react';
import { useHistory } from 'react-router-dom';

import { registerCommand } from '../../1-core/commands';
import { Gist } from '../../3-gist/Gist';
import { GistFile } from '../../3-gist/GistFile';
import { getSettingsGistPath } from '../../5-app/settings';
import { useStar } from '../../6-hooks/useStar';
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
  const history = useHistory();
  const isStarred = useStar(gist.id);
  const settings = getSettingsGistPath();

  if (settings) {
    registerCommand('settings', () => history.push(settings));
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

        {settings && (
          <Action name="editor-tabs--settings" icon="cog" navigate={settings} />
        )}
      </div>
    </nav>
  );
}
