import { Gist } from './Gist';
import { GistFileDetails } from './GistFileDetails';
import { Owner } from './Owner';
import { ValidURL } from './type-aliases';

export interface GistDetails extends Gist {
  files: { [key: string]: GistFileDetails };
  forks: any[];
  history: History[];
}

export interface History {
  user: Owner;
  version: string;
  committed_at: string;
  change_status: ChangeStatus;
  url: ValidURL;
}

export interface ChangeStatus {
  total: number;
  additions: number;
  deletions: number;
}
