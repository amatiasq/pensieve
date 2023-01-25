export type GHNodeSha = '[string GHNodeSha]';

export type GHRepoNodeType = 'blob' | 'file' | 'dir' | 'symlink' | 'submodule';

export interface GHApiRepositoryNode {
  type: GHRepoNodeType;
  sha: GHNodeSha;
  name: string;
  path: string;
  size?: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string;
  content: string;
  encoding: string;
  _links: Record<string, string>;
}
