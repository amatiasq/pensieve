import { UserName, ValidURL } from './type-aliases';

export interface RawOwner {
  login: UserName;
  id: number;
  node_id: string;
  avatar_url: ValidURL;
  gravatar_id: string;
  url: ValidURL;
  html_url: ValidURL;
  followers_url: ValidURL;
  following_url: ValidURL;
  gists_url: ValidURL;
  starred_url: ValidURL;
  subscriptions_url: ValidURL;
  organizations_url: ValidURL;
  repos_url: ValidURL;
  events_url: ValidURL;
  received_events_url: ValidURL;
  type: string;
  site_admin: boolean;
}
