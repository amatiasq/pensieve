import { ValidURL } from './type-aliases';

export interface GistFile {
  filename: string;
  type: string;
  language: string;
  raw_url: ValidURL;
  size: number;
}
