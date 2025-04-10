import styled from '@emotion/styled';
import { useEffect, useState } from 'react';
import { DEFAULT_SETTINGS } from '../../2-entities/Settings.ts';
import { DEFAULT_SHORTCUTS } from '../../2-entities/Shortcuts.ts';
import { RemoteJson } from '../../4-storage/helpers/RemoteJson.ts';
import { WriteOptions } from '../../4-storage/helpers/WriteOptions.ts';
import { useStore } from '../../6-hooks/useStore.ts';
import { isDeserializable, serialize } from '../../util/serialization.ts';
import { Loader } from '../atoms/Loader.tsx';
import { Editor } from '../Editor/Editor.tsx';

const EditorLoader = styled(Loader)`
  grid-area: editor;
`;

const TabContainer = styled.nav`
  grid-area: settings-header;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 2rem;
  padding: var(--sidebar-gap);
  gap: calc(var(--sidebar-gap) * 2);
  background-color: var(--bg-color);
`;

const Tab = styled.div`
  --spacing: calc(var(--sidebar-gap) * 1.6);

  cursor: default;
  padding: var(--spacing);
  border: 1px solid var(--border-color);
  background-color: var(--bg-color-sidebar);

  &:first-of-type {
    border-left: 1px solid var(--border-color);
  }

  &.active,
  &:hover {
    background-color: var(--bg-color-hover);
  }
`;

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
    <>
      <TabContainer>
        {tabs.map((x, i) => (
          <Tab
            key={x.title}
            className={tab === i ? 'active' : undefined}
            onClick={() => setTab(i)}
          >
            {x.title}
          </Tab>
        ))}
      </TabContainer>

      {loading ? (
        <EditorLoader />
      ) : (
        <Editor key={selected.title} gap="33px" ext=".json" {...selected} />
      )}
    </>
  );
}
