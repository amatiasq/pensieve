import './ContentEditor.scss';

import React from 'react';

import Editor, { useMonaco } from '@monaco-editor/react';

import { GistFile } from '../../model/GistFile';
import { isMobile } from '../../util/isMobile';
import { useSetting } from '../../hooks/useSetting';

const DEFAULT_OPTIONS = {
  contextmenu: false,
  renderLineHighlight: 'none',
} as const;

export function ContentEditor({
  file,
  value,
  onChange,
}: {
  file: GistFile;
  value: string;
  onChange: (newValue: string | undefined) => void;
}) {
  const monaco = useMonaco();
  const [rulers] = useSetting('rulers');
  const [tabSize] = useSetting('tabSize');
  const [wordWrap] = useSetting('wordWrap');
  const lines = value.split('\n').length;
  const language =
    getLanguageFor(file.name) ||
    file.language?.toLocaleLowerCase() ||
    'markdown';

  if (isMobile) {
    return (
      <textarea
        className="mobile-fallback"
        defaultValue={value}
        onChange={e => onChange(e.target.value)}
      ></textarea>
    );
  }

  return (
    <Editor
      height="100vh"
      theme="vs-dark"
      language={language}
      value={value}
      options={{
        ...DEFAULT_OPTIONS,
        minimap: { enabled: lines > 100 },
        rulers,
        tabSize,
        wordWrap: wordWrap ? 'on' : 'off',
      }}
      onChange={onChange}
    />
  );

  function getLanguageFor(filename: string) {
    if (!monaco) return null;

    const ext = `.${filename.split('.').pop()}`;
    const list = monaco.languages.getLanguages();
    const lang = list.find(
      lang =>
        lang.filenames?.includes(filename) || lang.extensions?.includes(ext),
    );
    return lang?.id;
  }
}
