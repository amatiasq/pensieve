import { RawGistFileDetails, RawGistFileItem } from './RawGistFile';
import { RawOwner } from './RawOwner';
import { GistId, SerializedDate, ValidURL } from './type-aliases';

export type RawGist = RawGistItem | RawGistDetails;

export interface RawGistItem {
  url: ValidURL;
  forks_url: ValidURL;
  commits_url: ValidURL;
  id: GistId;
  node_id: string;
  git_pull_url: ValidURL;
  git_push_url: ValidURL;
  html_url: ValidURL;
  files: { [key: string]: RawGistFileItem };
  public: boolean;
  created_at: SerializedDate;
  updated_at: SerializedDate;
  description: string;
  comments: number;
  user: null;
  comments_url: ValidURL;
  owner: RawOwner;
  truncated: boolean;
}

export interface RawGistDetails extends RawGistItem {
  files: { [key: string]: RawGistFileDetails };
  forks: any[];
  history: History[];
}

interface History {
  user: RawOwner;
  version: string;
  committed_at: string;
  change_status: ChangeStatus;
  url: ValidURL;
}

interface ChangeStatus {
  total: number;
  additions: number;
  deletions: number;
}
