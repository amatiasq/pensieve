import { AsyncStore } from '../AsyncStore';
import { RemoteValue } from './RemoteValue';

export class RemoteCollection<
  Type extends { id: Id },
  Id,
  ReadOptions,
  WriteOptions,
> extends RemoteValue<Type[], ReadOptions, WriteOptions> {
  constructor(store: AsyncStore<ReadOptions, WriteOptions>, key: string) {
    super(store, key, []);
  }

  async item(id: Id) {
    const list = await this.get();
    return list.find(x => x.id === id) || null;
  }

  async add(item: Type) {
    const list = await this.get();
    this.set([item, ...list]);
  }

  async edit(id: Id, editor: (item: Type) => Type) {
    const list = await this.get();
    const index = list.findIndex(x => x.id === id);
    const item = list[index];
    const newItem = editor(item);
    list[index] = newItem;
    this.set(list);
    return newItem;
  }

  async remove(id: Id) {
    const list = await this.get();
    const index = list.findIndex(x => x.id === id);
    if (index === -1) return null;
    const item = list[index];
    list.splice(index, 1);
    this.set(list);
    return item;
  }
}
