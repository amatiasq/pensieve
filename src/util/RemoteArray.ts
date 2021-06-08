export interface RemoteArrayOptions {
  cacheLifespanSeconds?: number;
}

export class RemoteCollection<T extends { id: U }, U> {
  readonly cacheLifespanSeconds: number;

  private cache: T[] | null = null;
  private cacheTime: Date = new Date();

  get isCached() {
    return this.cache != null && this.secondsCached < this.cacheLifespanSeconds;
  }

  get secondsCached() {
    const delta = Date.now() - Number(this.cacheTime);
    return delta / 1000;
  }

  constructor(
    private readonly fetch: () => Promise<T[]>,
    { cacheLifespanSeconds = 30 }: RemoteArrayOptions = {},
  ) {
    this.cacheLifespanSeconds = cacheLifespanSeconds;
  }

  async asArray() {
    if (!this.isCached) {
      this.cache = await this.fetch();
      this.cacheTime = new Date();
    }

    return this.cache!;
  }

  async asCollection() {
    return new MutableCollection(
      await this.asArray(),
      () => (this.cacheTime = new Date()),
    );
  }
}

class MutableCollection<T extends { id: U }, U> {
  constructor(
    private readonly list: T[],
    private readonly onMutate: () => void,
  ) {}

  add(item: T) {
    this.list.unshift(item);
    this.onMutate();
  }

  edit(id: U, editor: (item: T) => T) {
    const index = this.list.findIndex(x => x.id === id);
    const item = this.list[index];
    const newItem = editor(item);
    this.list[index] = newItem;
    this.onMutate();
    return newItem;
  }

  remove(id: U) {
    const index = this.list.findIndex(x => x.id === id);
    if (index === -1) return null;
    const item = this.list[index];
    this.list.splice(index, 1);
    this.onMutate();
    return item;
  }

  toJSON() {
    return this.list;
  }

  toArray() {
    return this.list;
  }
}
