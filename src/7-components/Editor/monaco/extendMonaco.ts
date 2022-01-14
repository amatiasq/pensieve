import { Monaco } from '@monaco-editor/react';
import { editor, languages } from 'monaco-editor';
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
    provideCustomLinks(monaco, links);
  }

  if (!highlight) {
    return;
  }

  const theme: ITokenThemeRule[] = [];
  const root: IMonarchLanguageRule[] = [];
  let counter = 0;

  for (const [pattern, color] of Object.entries(highlight)) {
    const token = `autotoken${counter}`;
    root.push([pattern, token]);
    theme.push({ token, foreground: color });
    counter++;
  }

  extendMonacoLanguage(monaco, 'markdown', { tokenizer: { root } });
  extendMonacoTheme(monaco, 'vs-dark', theme);

  // const extensions: Record<string, IMonarchLanguage> = {
  //   markdown: { tokenizer: { root: [] } },
  // };

  // for (const [key, value] of Object.entries(extensions)) {
  //   extendMonacoLanguage(monaco, key, value);
  // }
}
