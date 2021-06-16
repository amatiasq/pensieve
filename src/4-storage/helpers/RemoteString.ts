import { AsyncStore } from '../AsyncStore';
import { RemoteValue } from './RemoteValue';

const identity = (x: string) => x;

export class RemoteString<ReadOptions, WriteOptions> extends RemoteValue<
  string,
  ReadOptions,
  WriteOptions
> {
  constructor(
    store: AsyncStore<ReadOptions, WriteOptions>,
    key: string,
    defaultValue: string,
  ) {
    super(store, key, defaultValue, identity, identity);
  }
}
