import { ValidURL } from './type-aliases';

export interface RawGistFile {
  filename: string;
  type: string;
  language: string;
  raw_url: ValidURL;
  size: number;
}

export interface RawGistFileDetails extends RawGistFile {
  filename: string;
  type: string;
  language: string;
  raw_url: ValidURL;
  size: number;
  truncated: boolean;
  content: string;
}
