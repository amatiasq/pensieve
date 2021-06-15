import './ContentEditor.scss';

import { editor } from 'monaco-editor';
import React from 'react';

import Editor, { useMonaco } from '@monaco-editor/react';

import { isMobile } from '../../0-dom/isMobile';
import { getMetadataFromContent } from '../../2-entities/Note';
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

  const lines = value.split('\n').length;
  const { extension } = getMetadataFromContent(value);
  const language =
    getLanguageFor(extension) ||
    // getLanguageFor(defaultFileExtension) ||
    // file.language?.toLocaleLowerCase() ||
    'markdown';

  if (isMobile) {
    return (
      <MobileFallback {...{ language, value, readonly, onChange }} autofocus />
    );
  }

  return (
    <Editor
      className="editor"
      height="100vh"
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

  function getLanguageFor(ext: string) {
    if (!monaco) return null;

    const list = monaco.languages.getLanguages();
    const lang = list.find(lang => lang.extensions?.includes(ext));
    return lang?.id;
  }
}
