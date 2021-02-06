import { GistFile } from './GistFile';
import { ValidURL } from './type-aliases';

export interface GistFileDetails extends GistFile {
  filename: string;
  type: string;
  language: string;
  raw_url: ValidURL;
  size: number;
  truncated: boolean;
  content: string;
}
