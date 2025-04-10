import { Monaco } from '@monaco-editor/react';
import { editor, languages } from 'monaco-editor';
import initEditor from 'monaco-mermaid';
import { errorFor } from '../../../util/errorFor.ts';
import { extendMonacoLanguage } from './extendMonacoLanguage.ts';
import { provideCustomLinks } from './extendMonacoLinks.ts';
import { extendMonacoTheme } from './extendMonacoTheme.ts';

// type IMonarchLanguage = languages.IMonarchLanguage;
type IMonarchLanguageRule = languages.IMonarchLanguageRule;
type ITokenThemeRule = editor.ITokenThemeRule;

export function extendMonaco(
  monaco: Monaco,
  highlight: Record<string, string>,
  links: Record<string, string>,
) {
  if (links) {
    errorFor(
      () => provideCustomLinks(monaco, links),
      'Error in "links" entry from settings. Should be an Array<[string, string]>',
      links,
    );
  }

  if (!highlight) {
    return;
  }

  const theme: ITokenThemeRule[] = [];
  const root: IMonarchLanguageRule[] = [];
  let counter = 0;

  errorFor(() => {
    initEditor(monaco as any);
    const allLangs = monaco.languages.getLanguages();
    const lang = allLangs.find(({ id }) => id === 'mermaid');
    if (!lang) throw new Error(`Could not find language mermaid`);
    lang.extensions = ['.mmd', '.mermaid'];
  }, 'Error adding mermaid support to monaco');

  errorFor(
    () => {
      for (const [pattern, color] of Object.entries(highlight)) {
        errorFor(
          () => new RegExp(pattern),
          'Invalid regex pattern for highlighting',
          pattern,
        );

        const token = `autotoken${counter}`;
        root.push([pattern, token]);
        theme.push({ token, foreground: color });
        counter++;
      }
    },
    'Error processing highlight in settings. Should be an Array<[string, string]>',
    highlight,
  );

  errorFor(
    () => extendMonacoLanguage(monaco, 'markdown', { tokenizer: { root } }),
    `Error from extending monaco's language`,
    root,
  );

  errorFor(
    () => extendMonacoTheme(monaco, 'vs-dark', theme),
    `Error from extending monaco's theme`,
    theme,
  );

  // const extensions: Record<string, IMonarchLanguage> = {
  //   markdown: { tokenizer: { root: [] } },
  // };

  // for (const [key, value] of Object.entries(extensions)) {
  //   extendMonacoLanguage(monaco, key, value);
  // }
}
