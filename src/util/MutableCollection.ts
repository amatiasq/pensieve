export class MutableCollection<T extends { id: U }, U> {
  private hasMutated = false;

  constructor(private readonly list: T[], private readonly onSave: (mutated: T[]) => Promise<void>) {}

  add(item: T) {
    this.list.unshift(item);
    this.hasMutated = true;
  }

  edit(id: U, editor: (item: T) => T) {
    const index = this.list.findIndex(x => x.id === id);
    const item = this.list[index];
    const newItem = editor(item);
    this.list[index] = newItem;
    this.hasMutated = true;
    return newItem;
  }

  remove(id: U) {
    const index = this.list.findIndex(x => x.id === id);
    if (index === -1) return null;
    const item = this.list[index];
    this.list.splice(index, 1);
    this.hasMutated = true;
    return item;
  }

  save() {
    if (!this.hasMutated) return Promise.resolve();
    this.hasMutated = false;
    return this.onSave(this.list);
  }

  toJSON() {
    return this.list;
  }

  toArray() {
    return this.list;
  }
}
