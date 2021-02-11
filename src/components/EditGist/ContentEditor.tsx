import './ContentEditor.scss';

import React from 'react';

import Editor, { useMonaco } from '@monaco-editor/react';

import { useSetting } from '../../hooks/useSetting';
import { GistFile } from '../../model/GistFile';
import { isMobile } from '../../util/isMobile';

export function ContentEditor({
  file,
  value,
  readonly,
  onChange,
}: {
  file: GistFile;
  value: string;
  readonly?: boolean;
  onChange: (newValue: string | undefined) => void;
}) {
  const monaco = useMonaco();
  const [rulers] = useSetting('rulers');
  const [tabSize] = useSetting('tabSize');
  const [wordWrap] = useSetting('wordWrap');
  const [renderIndentGuides] = useSetting('renderIndentGuides');

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
        readOnly={readonly}
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
      onChange={onChange}
      options={{
        contextmenu: false,
        minimap: { enabled: lines > 100 },
        readOnly: readonly,
        renderIndentGuides,
        renderLineHighlight: 'none',
        rulers,
        tabSize,
        wordWrap: wordWrap ? 'on' : 'off',
      }}
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
