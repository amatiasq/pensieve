import { ValidURL } from './type-aliases';

export type RawGistFile = RawGistFileItem | RawGistFileDetails;

export interface RawGistFileItem {
  filename: string;
  type: string;
  language: string;
  raw_url: ValidURL;
  size: number;
}

export interface RawGistFileDetails extends RawGistFileItem {
  truncated: boolean;
  content: string;
}
