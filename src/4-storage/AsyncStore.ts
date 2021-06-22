import { WriteOptions } from './helpers/WriteOptions';

export interface AsyncStore {
  readAll(pattern: string): Promise<Record<string, string>>;
  read(key: string): Promise<string | null>;
  write(key: string, value: string, options?: WriteOptions): Promise<void>;
  delete(key: string, options?: WriteOptions): Promise<void>;
}
