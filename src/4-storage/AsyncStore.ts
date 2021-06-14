export type NoOptions = Record<string, unknown>;

export interface AsyncStore<ReadOptions = NoOptions, WriteOptions = NoOptions> {
  keys(): Promise<string[]>;
  has(key: string): Promise<boolean>;
  read(key: string, options?: ReadOptions): Promise<string | null>;
  write(key: string, value: string, options?: WriteOptions): Promise<void>;
  delete(key: string): Promise<void>;
}
