import { editor, Range } from 'monaco-editor';

export interface MatchDescription {
  text: string;
  capture: string[];
  row: number;
  col: number;
  prevLine: number;
  prevChar: number;
  range: Range;
}

export function getMatchesForRegex(pattern: string | RegExp) {
  const globalPattern = new RegExp(pattern, 'g');

  return (model: editor.ITextModel) => {
    const lines = model.getLinesContent();
    const result: MatchDescription[] = [];

    let prevLine = 0;
    let prevChar = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      for (const match of line.matchAll(globalPattern)) {
        const text = match[0];
        const capture = Array.from(match);
        const row = i;
        const col = match.index!;

        const range = new Range(
          row + 1,
          col + 1,
          row + 1,
          col + 1 + text.length,
        );

        result.push({
          text,
          capture,
          row,
          col,
          prevLine,
          prevChar,
          range,
        });

        prevLine = i;
        prevChar = match.index!;
      }
    }

    return result;
  };
}
