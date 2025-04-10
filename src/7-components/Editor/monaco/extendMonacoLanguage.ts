import { Monaco } from '@monaco-editor/react';
import { languages } from 'monaco-editor';

type IMonarchLanguage = languages.IMonarchLanguage;

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
    if (!Object.prototype.hasOwnProperty.call(language.tokenizer, category)) {
      language.tokenizer[category] = [];
    }

    if (Array.isArray(tokenDefs)) {
      language.tokenizer[category].unshift(...tokenDefs);
    }
  }

  for (const [key, value] of Object.keys(rest)) {
    if (Array.isArray(value)) {
      if (!Object.prototype.hasOwnProperty.call(language, key)) {
        language[key] = [];
      }

      language[key].unshift(...value);
    }
  }
}
