import { Monaco } from '@monaco-editor/react';
import { editor, languages } from 'monaco-editor';
import { errorFor } from '../../../util/errorFor';
import { extendMonacoLanguage } from './extendMonacoLanguage';
import { provideCustomLinks } from './extendMonacoLinks';
import { extendMonacoTheme } from './extendMonacoTheme';

// import IMonarchLanguage = languages.IMonarchLanguage;
import IMonarchLanguageRule = languages.IMonarchLanguageRule;
import ITokenThemeRule = editor.ITokenThemeRule;

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
