import './EditSettings.scss';

import React, { useContext, useEffect, useState } from 'react';

import { DEFAULT_SETTINGS } from '../../2-entities/Settings';
import { DEFAULT_SHORTCUTS } from '../../2-entities/Shortcuts';
import { AppStorageContext } from '../../5-app/contexts';
import { isDeserializable, serialize } from '../../util/serialization';
import { Loader } from '../atoms/Loader';
import { Editor } from '../Editor/Editor';

export function EditSettings() {
  const store = useContext(AppStorageContext);
  const [tab, setTab] = useState(0);
  const [settings, setSettings] = useState<string>('');
  const [shortcuts, setShortcuts] = useState<string>('');

  const tabs = [
    {
      title: 'Settings',
      content: settings,
      onSave: extractWrite(store.settings),
    },
    {
      title: 'Shortcuts',
      content: shortcuts,
      onSave: extractWrite(store.shortcuts),
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
    store.settings.read().then(setSettings);
    return store.settings.onChange(setSettings);
  }, []);

  useEffect(() => {
    store.shortcuts.read().then(setShortcuts);
    return store.shortcuts.onChange(setShortcuts);
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

  function extractWrite(
    remote: typeof store.settings | typeof store.shortcuts,
  ) {
    return (...params: Parameters<typeof remote['write']>) => {
      const [value, options] = params;
      if (!isDeserializable(value)) return alert('Invalid JSON');
      remote.write(value, options);
    };
  }
}
