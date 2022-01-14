import { Monaco } from '@monaco-editor/react';
import { languages } from 'monaco-editor';
import IMonarchLanguage = languages.IMonarchLanguage;

export async function extendMonacoLanguage(
  monaco: Monaco,
  baseLanguage: string,
  definition: IMonarchLanguage,
) {
  const allLangs = monaco.languages.getLanguages();
  const lang = allLangs.find(({ id }) => id === baseLanguage);

  if (!lang) {
    throw new Error(`Could not find language ${baseLanguage}`);
  }

  const { language } = await (lang as any).loader();
  const { tokenizer, ...rest } = definition;

  for (const [category, tokenDefs] of Object.entries(tokenizer)) {
    if (!language.tokenizer.hasOwnProperty(category)) {
      language.tokenizer[category] = [];
    }

    if (Array.isArray(tokenDefs)) {
      language.tokenizer[category].unshift(...tokenDefs);
    }
  }

  for (const [key, value] of Object.keys(rest)) {
    if (Array.isArray(value)) {
      if (!language.hasOwnProperty(key)) {
        language[key] = [];
      }

      language[key].unshift(...value);
    }
  }
}
