import { RawGistFileDetails } from '../contracts/RawGistFile';

export interface UpdateGistRequest {
  description?: string;
  files?: Record<string, { filename?: string; content?: string }>;
}
