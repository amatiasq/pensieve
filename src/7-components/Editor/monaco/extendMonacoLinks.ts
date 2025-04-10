import { Monaco } from '@monaco-editor/react';
import { editor, Uri } from 'monaco-editor';
import { errorFor } from '../../../util/errorFor.ts';
import { getMatchesForRegex } from './getMatchesForRegex.ts';

type ITextModel = editor.ITextModel;
type LinkCreator = Record<string, string>;

export function provideCustomLinks(monaco: Monaco, definition: LinkCreator) {
  const processors = Object.entries(definition)
    .map(([pattern, conversor]) => {
      const matcher = errorFor(
        () => getMatchesForRegex(pattern),
        'Invalid regex pattern for link',
        pattern,
        conversor,
      );

      if (!matcher) {
        return null;
      }

      return (model: ITextModel) =>
        matcher(model).map(({ range, capture }) => ({
          range,
          url: getUrlFrom(conversor, capture),
        }));
    })
    .filter(isNotNull);

  monaco.languages.registerLinkProvider('markdown', {
    provideLinks: model => ({ links: processors.flatMap(x => x(model)) }),
  });
}

function getUrlFrom(conversor: string, captures: string[]) {
  if (typeof conversor !== 'string') {
    throw new Error(`URL pattern is not a string: ${typeof conversor}`);
  }

  const url = conversor.replace(
    /\$(\d+)/g,
    (_, index) => captures[index] || '',
  );

  return errorFor(
    () => Uri.parse(url),
    `Invalid URL generated from settings: ${url}`,
    conversor,
    captures,
  );
}

function isNotNull<T>(x: T | undefined | null): x is T {
  return x != null;
}
