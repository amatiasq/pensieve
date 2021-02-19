import { RawGist } from './RawGist';

export type CompressedGist = ReturnType<typeof compressGist>;

export function compressGist<T extends RawGist>({
  description,
  files,
  id,
  public: p,
  created_at,
  updated_at,
  html_url,
  comments,
  owner,
}: T) {
  return {
    description,
    files,
    id,
    public: p,
    created_at,
    updated_at,
    html_url,
    comments,
    owner: { login: owner?.login },
  };
}
