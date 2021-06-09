import { GithubSha } from './GithubSha';

export interface RepositoryFile {
  name: string;
  path: string;
  sha: GithubSha;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string;
  type: string;
  content: string;
  encoding: string;
  _links: Record<string, string>;
}
