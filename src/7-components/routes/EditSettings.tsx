import './EditSettings.scss';

import React, { useEffect, useState } from 'react';

import { DEFAULT_SETTINGS } from '../../2-entities/Settings';
import { DEFAULT_SHORTCUTS } from '../../2-entities/Shortcuts';
import { RemoteJson } from '../../4-storage/helpers/RemoteJson';
import { WriteOptions } from '../../4-storage/helpers/WriteOptions';
import { useStore } from '../../6-hooks/useStore';
import { isDeserializable, serialize } from '../../util/serialization';
import { Loader } from '../atoms/Loader';
import { Editor } from '../Editor/Editor';

function useRemoteJson<T>(remote: RemoteJson<T>) {
  const [loading, setLoading] = useState(true);
  const [value, setValue] = useState('');

  useEffect(() => {
    const read = () =>
      remote
        .read()
        .then(x => setValue(x!))
        .finally(() => setLoading(false));

    read();
    return remote.onChange(read);
  }, []);

  return [value, save, loading] as const;

  function save(value: string, options?: WriteOptions) {
    if (!isDeserializable(value)) return alert('Invalid JSON');
    remote.write(value, options);
  }
}

export function EditSettings() {
  const storage = useStore();
  const [tab, setTab] = useState(0);

  const [settings, setSettings, lSettings] = useRemoteJson(storage.settings);
  const [shortcuts, setShortcuts, lShortcuts] = useRemoteJson(
    storage.shortcuts,
  );

  const tabs = [
    {
      title: 'Settings',
      content: settings,
      loading: lSettings,
      onSave: setSettings,
    },
    {
      title: 'Shortcuts',
      content: shortcuts,
      loading: lShortcuts,
      onSave: setShortcuts,
    },
    {
      title: 'Default settings',
      content: serialize(DEFAULT_SETTINGS),
      loading: false,
      readonly: true,
    },
    {
      title: 'Default shortcuts',
      content: serialize(DEFAULT_SHORTCUTS),
      loading: false,
      readonly: true,
    },
  ] as const;

  const { loading, ...selected } = tabs[tab];

  return (
    <div className="settings-editor">
      <nav>
        {tabs.map((x, i) => (
          <div key={x.title} className="tab" onClick={() => setTab(i)}>
            {x.title}
          </div>
        ))}
      </nav>

      {loading ? (
        <Loader />
      ) : (
        <Editor key={selected.title} gap="33px" ext=".json" {...selected} />
      )}
    </div>
  );
}
