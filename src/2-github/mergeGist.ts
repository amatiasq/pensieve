import { RawGist } from './RawGist';
import { RawGistFile } from './RawGistFile';

export function mergeGist(prev: RawGist, curr: RawGist) {
  const files: Record<string, RawGistFile> = {};

  for (const [name, data] of Object.entries(curr.files)) {
    files[name] = {
      ...(prev.files[name] || {}),
      ...data,
    };
  }

  return {
    ...prev,
    ...curr,
    files,
  };
}
