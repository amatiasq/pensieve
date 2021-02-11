import './ContentEditor.scss';

import React from 'react';

import Editor, { useMonaco } from '@monaco-editor/react';

import { GistFile } from '../../model/GistFile';
import { isMobile } from '../../util/isMobile';

const DEFAULT_OPTIONS = {
  contextmenu: false,
  tabSize: 2,
  wordWrap: 'on',
  renderLineHighlight: 'none',
  rulers: [80, 120] as number[],
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
