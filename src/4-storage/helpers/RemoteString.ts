import { FinalStore } from '../index';
import { RemoteValue } from './RemoteValue';

const identity = (x: string) => x;

export class RemoteString extends RemoteValue<string> {
  constructor(store: FinalStore, key: string, defaultValue: string) {
    super(store, key, defaultValue, identity, identity);
  }
}
