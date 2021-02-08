import { RawGistDetails } from './../contracts/RawGist';
import { ClientStorage } from '@amatiasq/client-storage';
import { RawGist } from '../contracts/RawGist';
import { GistId } from '../contracts/type-aliases';
import { fetchGist, fetchGists } from '../services/github_api';
import { Gist } from './Gist';

interface StoredGists {
  order: GistId[];
  data: Partial<Record<GistId, RawGist | RawGistDetails>>;
}

export class GistRepository {
  private readonly storage = new ClientStorage<StoredGists>('np.gists', {
    default: { order: [], data: {} },
  });

  private readonly pool = new Map<string, Gist>();
  private readonly list: Gist[] = [];
  private page = 0;

  private get store() {
    return this.storage.get() as StoredGists;
  }

  get all() {
    return this.list;
  }

  getListFromCache() {
    return this.store.order.map(x => this.getById(x)).filter(Boolean) as Gist[];
  }

  fetchMore() {
    this.page++;
    return fetchGists(this.page).then(x => this.addEntries(x));
  }

  reset() {
    this.list.length = 0;
    this.page = 0;
  }

  getById(id: GistId) {
    if (this.pool.has(id)) {
      return this.pool.get(id) as Gist;
    }

    const { data } = this.store;

    if (id in data) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const instance = new Gist(data[id]!);
      this.pool.set(id, instance);
      return instance;
    }

    return null;
  }

  fetchById(id: GistId) {
    if (this.hasCached(id)) {
      return (this.getById(id) as Gist).fetch();
    }

    return fetchGist(id).then(x => this.saveToCache(new Gist(x)));
  }

  private hasCached(id: GistId) {
    return this.pool.has(id) || id in this.store.data;
  }

  private addEntries(list: RawGist[]) {
    const wrapped = list.map(x => {
      const existing = this.getById(x.id);
      return existing ? existing.setData(x) : new Gist(x);
    });

    wrapped.forEach(this.saveToCache);

    this.list.push(...wrapped);
    this.saveToStorage();

    return [...this.list];
  }

  private readonly saveToCache = (gist: Gist) => {
    this.pool.set(gist.id, gist);
    return gist;
  };

  private readonly saveToStorage = () => {
    const raw = [...this.pool.entries()].map(([id, gist]) => [
      id,
      gist.toJSON(),
    ]);

    const order = this.list.map(x => x.id);
    const data = Object.fromEntries(raw);

    const stored = this.storage.get() || { data: [] };

    this.storage.set({
      order,
      data: {
        ...stored.data,
        ...data,
      },
    });
  };
}

export const gists = new GistRepository();
