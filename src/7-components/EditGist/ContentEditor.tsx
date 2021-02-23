import * as monaco from 'monaco-editor';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import Editor, { useMonaco } from '@monaco-editor/react';

import { isMobile } from '../../1-core/isMobile';
import { GistFile } from '../../3-gist/GistFile';
import { useSetting } from '../../6-hooks/useSetting';
import { MobileFallback } from './MobileFallback';

type Monaco = typeof monaco;
type IEditor = monaco.editor.IStandaloneCodeEditor;

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
  const { filename } = useParams() as { [key: string]: string };
  const monaco = useMonaco();
  const [editor, setEditor] = useState<IEditor | null>(null);

  const [rulers] = useSetting('rulers');
  const [tabSize] = useSetting('tabSize');
  const [wordWrap] = useSetting('wordWrap');
  const [renderIndentGuides] = useSetting('renderIndentGuides');
  const [defaultFileExtension] = useSetting('defaultFileExtension');
  const autofocus = file.name === filename;

  const lines = value.split('\n').length;
  const language =
    getLanguageFor(file.name) ||
    getLanguageFor(defaultFileExtension) ||
    file.language?.toLocaleLowerCase() ||
    'markdown';

  if (isMobile) {
    return (
      <MobileFallback {...{ language, value, readonly, autofocus, onChange }} />
    );
  }

  useEffect(() => {
    editor?.updateOptions(getEditorOptions());
  }, [readonly, renderIndentGuides, rulers, tabSize, wordWrap]);

  return (
    <Editor
      height="calc(100vh - 42px)"
      theme="vs-dark"
      language={language}
      value={value}
      onChange={onChange}
      onMount={x => autofocus && x.focus()}
      options={getEditorOptions()}
    />
  );

  function getEditorOptions() {
    return {
      contextmenu: false,
      minimap: { enabled: lines > 100 },
      readOnly: readonly,
      renderIndentGuides,
      renderLineHighlight: 'none',
      rulers,
      tabSize,
      wordWrap: wordWrap ? 'on' : 'off',
    } as const;
  }

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
