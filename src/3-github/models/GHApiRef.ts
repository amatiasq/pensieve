import { GHCommitSha } from './GHApiCommit.ts';

export interface GHApiRef {
  ref: string;
  node_id: string;
  url: string;
  object: Commit;
}

interface Commit {
  type: 'commit';
  sha: GHCommitSha;
  url: string;
}
