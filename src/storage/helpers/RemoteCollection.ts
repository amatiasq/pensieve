import { AsyncStore } from '../../storage/AsyncStore';
import { RemoteValue } from './RemoteValue';

export class RemoteCollection<T extends { id: U }, U> extends RemoteValue<T[]> {
  constructor(store: AsyncStore, key: string) {
    super(store, key, []);
  }

  async add(item: T) {
    const list = await this.get();
    list.unshift(item);
    this.set([item, ...list]);
  }

  async edit(id: U, editor: (item: T) => T) {
    const list = await this.get();
    const index = list.findIndex(x => x.id === id);
    const item = list[index];
    const newItem = editor(item);
    list[index] = newItem;
    this.set(list);
    return newItem;
  }

  async remove(id: U) {
    const list = await this.get();
    const index = list.findIndex(x => x.id === id);
    if (index === -1) return null;
    const item = list[index];
    list.splice(index, 1);
    this.set(list);
    return item;
  }
}
