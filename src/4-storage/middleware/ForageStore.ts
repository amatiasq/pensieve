import { debugMethods } from '../../util/debugMethods';
import { AsyncStore } from '../AsyncStore';
import { patternToRegex } from '../helpers/patternToRegex';

export class ForageStore implements AsyncStore {
  constructor(private readonly forage: LocalForage) {
    debugMethods(this, ['readAll', 'read', 'write', 'delete']);
  }

  async readAll(pattern: string) {
    const regex = patternToRegex(pattern);
    const keys = await this.forage.keys();
    const match = keys.filter(x => regex.test(x));

    const promises = match.map(async key => {
      const content = await this.read(key);
      return [key, content] as const;
    });

    const entries = await Promise.all(promises);
    const result = entries.filter(x => x[1]) as Array<[string, string]>;
    return Object.fromEntries(result);
  }

  read(key: string) {
    return this.forage.getItem<string>(key);
  }

  async write(key: string, value: string) {
    await this.forage.setItem(key, value);
  }

  async delete(key: string) {
    await this.forage.removeItem(key);
  }
}
