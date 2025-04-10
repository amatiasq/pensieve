import { css } from '@emotion/react';
import Editor, { useMonaco } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import { isMobile } from '../../0-dom/isMobile.ts';
import { getMetadataFromContent } from '../../2-entities/Note.ts';
import { useSetting } from '../../6-hooks/useSetting.ts';
import { MobileFallback } from './MobileFallback.tsx';
import { extendMonaco } from './monaco/extendMonaco.ts';
import * as hardcodedConfig from './monacoConfiguration.ts';

const styles = css`
  .monaco-editor {
    overflow: hidden;
  }
`;

export function MonacoEditor({
  value,
  ext,
  gap,
  readonly,
  onChange,
}: {
  value: string;
  ext?: string;
  gap?: string;
  readonly?: boolean;
  onChange: (newValue: string | undefined) => void;
}) {
  const monaco = useMonaco();
  const [links] = useSetting('links');
  const [rulers] = useSetting('rulers');
  const [tabSize] = useSetting('tabSize');
  const [wordWrap] = useSetting('wordWrap');
  const [highlight] = useSetting('highlight');
  const [renderIndentGuides] = useSetting('renderIndentGuides');

  const lines = value.split('\n').length;
  const { extension } = getMetadataFromContent(value);
  const language = getLanguageFor(ext || extension) || 'markdown';

  if (isMobile) {
    return (
      <MobileFallback
        {...{ gap, language, value, readonly, onChange }}
        autofocus
      />
    );
  }

  return (
    <Editor
      css={styles}
      height={gap ? `calc(100vh - ${gap}` : '100vh'}
      theme={hardcodedConfig.theme}
      language={language}
      value={value}
      options={getEditorOptions(language === 'markdown')}
      onChange={onChange}
      beforeMount={monaco => extendMonaco(monaco, highlight, links)}
      onMount={editor => editor.focus()}
    />
  );

  function getEditorOptions(isMarkdown: boolean) {
    return {
      ...hardcodedConfig,
      'semanticHighlighting.enabled': true,
      minimap: { enabled: lines > 100 },
      readOnly: readonly,
      renderIndentGuides,
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
