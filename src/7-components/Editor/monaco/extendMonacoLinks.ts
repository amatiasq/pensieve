import { Monaco } from '@monaco-editor/react';
import { editor, Uri } from 'monaco-editor';
import { getMatchesForRegex } from './getMatchesForRegex';
import ITextModel = editor.ITextModel;

type LinkCreator = Record<string, string>;

export function provideCustomLinks(monaco: Monaco, definition: LinkCreator) {
  const processors = Object.entries(definition).map(([pattern, conversor]) => {
    const matcher = getMatchesForRegex(pattern);

    return (model: ITextModel) =>
      matcher(model).map(({ range, capture }) => ({
        range,
        url: getUrlFrom(conversor, capture),
      }));
  });

  monaco.languages.registerLinkProvider('markdown', {
    provideLinks: model => ({ links: processors.flatMap(x => x(model)) }),
  });
}

function getUrlFrom(conversor: string, captures: string[]) {
  const url = conversor.replace(
    /\$(\d+)/g,
    (_, index) => captures[index] || '',
  );

  return Uri.parse(url);
}
