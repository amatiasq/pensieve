import { GistFile } from './GistFile';
import { Owner } from './Owner';
import { GistId, SerializedDate, ValidURL } from './type-aliases';

export interface Gist {
  url: ValidURL;
  forks_url: ValidURL;
  commits_url: ValidURL;
  id: GistId;
  node_id: string;
  git_pull_url: ValidURL;
  git_push_url: ValidURL;
  html_url: ValidURL;
  files: { [key: string]: GistFile };
  public: boolean;
  created_at: SerializedDate;
  updated_at: SerializedDate;
  description: string;
  comments: number;
  user: null;
  comments_url: ValidURL;
  owner: Owner;
  truncated: boolean;
}
