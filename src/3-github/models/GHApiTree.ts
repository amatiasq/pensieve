import { GHNodeSha, GHRepoNodeType } from './GHApiRepositoryNode.ts';

export type GHTreeSha = '[string GHTreeSha]';

export interface GHApiTree {
  sha: GHTreeSha;
  url: string;
  tree: TreeNode[];
  truncated: boolean;
}

interface TreeNode {
  type: GHRepoNodeType;
  path: string;
  mode: string;
  size?: number;
  sha: GHNodeSha;
  url: string;
}
