export type GHCommitSha = '[string GHCommitSha]';

export interface GHApiCommit {
  sha: GHCommitSha;
  node_id: string;
  url: string;
  html_url: string;
  author: Author;
  committer: Author;
  message: string;
  tree: Tree;
  parents: Parent[];
  verification: Verification;
}

interface Author {
  date: string;
  name: string;
  email: string;
}

interface Parent {
  url: string;
  sha: GHCommitSha;
  html_url: string;
}

interface Tree {
  url: string;
  sha: string;
}

interface Verification {
  verified: boolean;
  reason: string;
  signature: null;
  payload: null;
}
