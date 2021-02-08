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
  private readonly ordered: Gist[] = [];
  private page = 1;

  private get store() {
    return this.storage.get() as StoredGists;
  }

  get all() {
    const { order } = this.store;

    if (!this.ordered.length && order) {
      const fromStorage = order
        .map(id => this.getById(id))
        .filter(Boolean) as Gist[];

      this.ordered.push(...fromStorage);
    }

    return this.ordered;
  }

  fetchAll() {
    this.ordered.length = 0;
    this.page = 1;
    return fetchGists().then(x => this.addEntries(x));
  }

  fetchMore() {
    this.page++;
    return fetchGists(this.page).then(x => this.addEntries(x));
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
    if (this.pool.has(id)) {
      return (this.getById(id) as Gist).fetch();
    }

    return fetchGist(id).then(x => this.saveToCache(new Gist(x)));
  }

  private addEntries(list: RawGist[]) {
    const wrapped = list.map(x => {
      const existing = this.getById(x.id);
      return existing ? existing.setData(x) : new Gist(x);
    });

    wrapped.forEach(this.saveToCache);

    this.ordered.push(...wrapped);
    this.saveToStorage();

    return [...this.ordered];
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

    const order = this.ordered.map(x => x.id);
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
