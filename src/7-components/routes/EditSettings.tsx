import './EditSettings.scss';

import React, { useContext, useEffect, useState } from 'react';

import { DEFAULT_SETTINGS } from '../../2-entities/Settings';
import { DEFAULT_SHORTCUTS } from '../../2-entities/Shortcuts';
import { WriteOptions } from '../../4-storage/helpers/WriteOptions';
import { NotesStorageContext } from '../../5-app/contexts';
import { isDeserializable, serialize } from '../../util/serialization';
import { Loader } from '../atoms/Loader';
import { Editor } from '../Editor/Editor';

export function EditSettings() {
  const { settings, shortcuts } = useContext(NotesStorageContext);
  const [tab, setTab] = useState(0);
  const [rawSettings, setRawSettings] = useState<string>('');
  const [rawShortcuts, setRawShortcuts] = useState<string>('');

  const tabs = [
    {
      title: 'Settings',
      content: rawSettings,
      onSave: save(settings),
    },
    {
      title: 'Shortcuts',
      content: rawShortcuts,
      onSave: save(shortcuts),
    },
    {
      title: 'Default settings',
      content: serialize(DEFAULT_SETTINGS),
      readonly: true,
    },
    {
      title: 'Default shortcuts',
      content: serialize(DEFAULT_SHORTCUTS),
      readonly: true,
    },
  ] as const;

  useEffect(() => {
    const read = () => settings.read().then(x => setRawSettings(x!));
    read();
    return settings.onChange(read);
  }, []);

  useEffect(() => {
    const read = () => shortcuts.read().then(x => setRawShortcuts(x!));
    read();
    return shortcuts.onChange(read);
  }, []);

  const selected = tabs[tab];

  return (
    <div className="settings-editor">
      <nav>
        {tabs.map((x, i) => (
          <div className="tab" onClick={() => setTab(i)}>
            {x.title}
          </div>
        ))}
      </nav>

      {selected.content ? (
        <Editor key={selected.title} gap="33px" ext=".json" {...selected} />
      ) : (
        <Loader />
      )}
    </div>
  );

  function save(remote: typeof settings | typeof shortcuts) {
    return (value: string, options?: WriteOptions) => {
      if (!isDeserializable(value)) return alert('Invalid JSON');
      remote.write(value, options);
    };
  }
}
