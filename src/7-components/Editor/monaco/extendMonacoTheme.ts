import { Monaco } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import { theme } from '../monacoConfiguration.ts';

type BuiltinTheme = editor.BuiltinTheme;
type ITokenThemeRule = editor.ITokenThemeRule;

export function extendMonacoTheme(
  monaco: Monaco,
  base: BuiltinTheme,
  rules: ITokenThemeRule[],
) {
  monaco.editor.defineTheme(theme, {
    base,
    inherit: true,
    colors: {},
    rules,
  });
}
