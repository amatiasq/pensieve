export type NoOptions = Record<string, unknown>;

type P<T> = Partial<T>;

export interface AsyncStore<ReadOptions = NoOptions, WriteOptions = NoOptions> {
  keys(): Promise<string[]>;
  has(key: string): Promise<boolean>;
  read(key: string, options?: P<ReadOptions>): Promise<string | null>;
  write(key: string, value: string, options?: P<WriteOptions>): Promise<void>;
  delete(key: string): Promise<void>;
}
