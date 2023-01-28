import 'monaco-editor/esm/vs/basic-languages/monaco.contribution';

import type { editor } from 'monaco-editor';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { createEffect, createMemo, createSignal } from 'solid-js';
import { useActiveRepo } from './useActiveRepo';

export function Editor(props: { route: string; readonly?: boolean }) {
  let element: HTMLDivElement = null!;
  let editor: editor.IStandaloneCodeEditor = null!;

  const [content, setContent] = createSignal(null as string | null);

  const language = createMemo(() => {
    const extension = props.route.split('.').pop()!;
    return getLanguageFor(`.${extension}`) || 'markdown';
  });

  initializeMonaco();

  createEffect(() => {
    useActiveRepo()?.getFileContent(props.route).then(update);
  });

  return <div ref={element} />;

  function update(content: string | null) {
    setContent(content);
    editor.setValue(content || '');
  }

  function initializeMonaco() {
    createEffect(() => {
      if (editor) editor.dispose();

      editor = monaco.editor.create(element, {
        value: content() || '',
        theme: 'vs-dark',
        readOnly: props.readonly || false,
        wordBasedSuggestions: language() === 'markdown' ? false : true,
        language: language(),
        rulers: [80, 120],
        tabSize: 2,
        'semanticHighlighting.enabled': true,
        wordWrap: true ? 'on' : 'off',
      });
    });
  }
}

function getLanguageFor(ext: string) {
  if (!monaco) return null;
  const list = monaco.languages.getLanguages();
  const lang = list.find((lang: any) => lang.extensions?.includes(ext));
  return lang?.id;
}

// const styles = css`
//   .monaco-editor {
//     overflow: hidden;
//   }
// `;

// export function MonacoEditor({
//   value,
//   ext,
//   gap,
//   readonly,
//   onChange,
// }: {
//   value: string;
//   ext?: string;
//   gap?: string;
//   readonly?: boolean;
//   onChange: (newValue: string | undefined) => void;
// }) {
//   const monaco = useMonaco();

//   const lines = value.split('\n').length;
//   const { extension } = getMetadataFromContent(value);
//   const language = getLanguageFor(ext || extension) || 'markdown';

//   if (isMobile) {
//     return (
//       <MobileFallback
//         {...{ gap, language, value, readonly, onChange }}
//         autofocus
//       />
//     );
//   }

//   return (
//     <Editor
//       css={styles}
//       height={gap ? `calc(100vh - ${gap}` : '100vh'}
//       theme={hardcodedConfig.theme}
//       language={language}
//       value={value}
//       options={getEditorOptions(language === 'markdown')}
//       onChange={onChange}
//       beforeMount={(monaco) => extendMonaco(monaco, highlight, links)}
//       onMount={(editor) => editor.focus()}
//     />
//   );

//   function getEditorOptions(isMarkdown: boolean) {
//     return {
//       ...hardcodedConfig,
//       'semanticHighlighting.enabled': true,
//       minimap: { enabled: lines > 100 },
//       readOnly: readonly,
//       renderIndentGuides,
//       rulers,
//       tabSize,
//       wordBasedSuggestions: isMarkdown ? false : true,
//       wordWrap: wordWrap ? 'on' : 'off',
//     } as editor.IStandaloneEditorConstructionOptions;
//   }
// }
