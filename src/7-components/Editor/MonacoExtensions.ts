import { editor } from 'monaco-editor';

type Monaco = typeof import('monaco-editor');
// type Editor = import('monaco-editor').editor.IStandaloneCodeEditor;

const TOKEN_PATTERN = /{{(\w+)}}/g;

export function applyMonacoExtensions(monaco: Monaco) {
  defineSemanticTokens(monaco);
  // defineHoverProvider(monaco);
  defineCodeLenses(monaco);
  defineLinks(monaco);
}

function defineLinks(monaco: Monaco) {
  monaco.languages.registerLinkProvider('markdown', {
    provideLinks: model => {
      const links = getTokenMatchPositions(
        model,
        ({ match, row, col, width }) => {
          const range = new monaco.Range(
            row + 1,
            col + 1,
            row + 1,
            col + width,
          );

          console.log({ match });

          return {
            range,
            url: `${location.origin}/note/${match}`,
            tooltip: `Note: This is a note`,
          };
        },
      );

      return { links };
    },
  });
}

function defineCodeLenses(monaco: Monaco) {
  monaco.languages.registerCodeLensProvider('markdown', {
    provideCodeLenses: model => {
      const [range] = getTokenMatchPositions(model, ({ row, col, width }) => {
        return new monaco.Range(row + 1, col + 1, row + 1, col + width);
      });

      return {
        lenses: [
          {
            range,
            id: 'THIS IS MY TEST',
            command: { id: 0, title: 'OPEN' },
          },
        ],
        dispose: () => {
          // noop
        },
      };
    },
    resolveCodeLens: function (model, codeLens, token) {
      return codeLens;
    },
  });
}

function defineHoverProvider(monaco: Monaco) {
  monaco.languages.registerHoverProvider('markdown', {
    provideHover: model => {
      const [range] = getTokenMatchPositions(model, ({ row, col, width }) => {
        console.log({ row, col, width });
        return new monaco.Range(row, col, row, col + width);
      });

      return { range, contents: [{ value: `**LINK**` }] };
    },
  });
}

function defineSemanticTokens(monaco: Monaco) {
  const legend = { tokenTypes: ['crosslink'], tokenModifiers: [] };

  monaco.languages.registerDocumentSemanticTokensProvider('markdown', {
    getLegend: () => legend,
    provideDocumentSemanticTokens: model => {
      const data: number[] = [];

      getTokenMatchPositions(model, ({ row, col, width, prevLine, prevChar }) =>
        data.push(
          // translate line to deltaLine
          row - prevLine,
          // for the same line, translate start to deltaStart
          prevLine === row ? col - prevChar : col,
          width,
          0,
          0,
        ),
      );

      return {
        data: new Uint32Array(data),
        resultId: null as any,
      };
    },
    releaseDocumentSemanticTokens: () => {
      /*noop*/
    },
  });

  // add some missing tokens
  monaco.editor.defineTheme('myCustomTheme', {
    base: 'vs-dark',
    inherit: true,
    rules: [{ token: 'crosslink', foreground: 'ff0000', fontStyle: 'italic' }],
    colors: {
      red: 'ff0000',
    },
  });

  monaco.editor.setTheme('myCustomTheme');
}

function getTokenMatchPositions<T>(
  model: editor.ITextModel,
  callback: (args: {
    match: string;
    row: number;
    col: number;
    width: number;
    prevLine: number;
    prevChar: number;
  }) => T,
) {
  const lines = model.getLinesContent();
  const result: T[] = [];

  let prevLine = 0;
  let prevChar = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // eslint-disable-next-line no-cond-assign
    for (let match = null; (match = TOKEN_PATTERN.exec(line)); ) {
      result.push(
        callback({
          match: match[1],
          row: i,
          col: match.index,
          width: match[0].length,
          prevLine,
          prevChar,
        }),
      );

      prevLine = i;
      prevChar = match.index;
    }
  }

  return result;
}
