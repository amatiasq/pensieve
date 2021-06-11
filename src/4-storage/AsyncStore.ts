export interface AsyncStore {
  keys(): Promise<string[]>;
  has(key: string): Promise<boolean>;
  readText(key: string): Promise<string | null>;
  read<T>(key: string): Promise<T | null>;
  writeText(key: string, value: string): Promise<void>;
  write<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
}
