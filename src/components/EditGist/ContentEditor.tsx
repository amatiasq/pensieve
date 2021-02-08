import React from 'react';

import Editor from '@monaco-editor/react';

import { GistFile } from '../../model/GistFile';

const DEFAULT_OPTIONS = {
  contextmenu: false,
  wordWrap: 'on',
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
  const lines = value.split('\n').length;

  return (
    <Editor
      height="100vh"
      theme="vs-dark"
      defaultLanguage={file.language.toLowerCase()}
      value={value}
      options={{
        ...DEFAULT_OPTIONS,
        minimap: { enabled: lines > 100 },
      }}
      onChange={onChange}
    />
  );
}
