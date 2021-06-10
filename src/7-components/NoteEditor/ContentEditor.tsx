import { editor } from 'monaco-editor';
import React from 'react';

import Editor, { useMonaco } from '@monaco-editor/react';

import { isMobile } from '../../1-core/isMobile';
import { useSetting } from '../../6-hooks/useSetting';
import { MobileFallback } from './MobileFallback';

// type Monaco = typeof monaco;
// type IEditor = monaco.editor.IStandaloneCodeEditor;

export function ContentEditor({
  value,
  readonly,
  onChange,
}: {
  value: string;
  readonly?: boolean;
  onChange: (newValue: string | undefined) => void;
}) {
  const monaco = useMonaco();

  const [rulers] = useSetting('rulers');
  const [tabSize] = useSetting('tabSize');
  const [wordWrap] = useSetting('wordWrap');
  const [renderIndentGuides] = useSetting('renderIndentGuides');
  // const [defaultFileExtension] = useSetting('defaultFileExtension');

  const lines = value.split('\n').length;
  const language =
    // getLanguageFor(file.name) ||
    // getLanguageFor(defaultFileExtension) ||
    // file.language?.toLocaleLowerCase() ||
    'markdown';

  if (isMobile) {
    return <MobileFallback {...{ language, value, readonly, onChange }} autofocus />;
  }

  return (
    <Editor
      height="calc(100vh - 42px)"
      theme="vs-dark"
      language={language}
      value={value}
      onChange={onChange}
      onMount={x => x.focus()}
      options={getEditorOptions(language === 'markdown')}
    />
  );

  function getEditorOptions(isMarkdown: boolean) {
    return {
      contextmenu: false,
      minimap: { enabled: lines > 100 },
      readOnly: readonly,
      renderIndentGuides,
      renderLineHighlight: 'none',
      rulers,
      tabSize,
      wordBasedSuggestions: isMarkdown ? false : true,
      wordWrap: wordWrap ? 'on' : 'off',
    } as editor.IStandaloneEditorConstructionOptions;
  }

  // function getLanguageFor(filename: string) {
  //   if (!monaco) return null;

  //   const ext = `.${filename.split('.').pop()}`;
  //   const list = monaco.languages.getLanguages();
  //   const lang = list.find(lang => lang.filenames?.includes(filename) || lang.extensions?.includes(ext));
  //   return lang?.id;
  // }
}
