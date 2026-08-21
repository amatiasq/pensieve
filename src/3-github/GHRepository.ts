import { get, set } from 'idb-keyval';
import { HttpError, POST } from '../1-core/http.ts';
import { createStore as createIdbStore } from '../1-core/idb.ts';
import { ghCommitEndpoint, ghTarballEndpoint } from './gh-utils.ts';
import { parseTarball } from './parseTarball.ts';
import { GithubToken } from './GithubAuth.ts';
import { githubGraphql } from './GithubGraphQlApi.ts';
import { GithubRestApi, MediaType } from './GithubRestApi.ts';
import {
  GHApiRepositoryNode,
  GHNodeSha,
  GHRepoNodeType,
} from './models/GHApiRepositoryNode.ts';

const CREATE_REPO_CONFIG = {
  has_issues: false,
  has_projects: false,
  has_wiki: false,
  auto_init: true,
  allow_merge_commit: true,
  allow_squash_merge: false,
  allow_rebase_merge: false,
  delete_branch_on_merge: false,
  has_downloads: false,
  is_template: false,
};

const FETCH_BATCH_SIZE = 20;

// Una petición por fichero sólo vale para el puñado que cambió desde la última
// sincronización. Pasado esto, quien tiene que traer los datos es el tarball, y
// seguir pidiendo de uno en uno agota el rate limit de la cuenta entera —no sólo
// de esta carga— para la hora siguiente.
const MAX_INDIVIDUAL_FETCHES = 200;

// «Esto no se arregla pidiendo ficheros»: lo lanza la sincronización por árbol
// para que quien la llamó se lo pida al tarball, que es una sola petición.
class TooManyIndividualReads extends Error {}

// any is necessary here because of https://github.com/microsoft/TypeScript/issues/14174#issuecomment-856812565
export type StagedFiles = Record<string, any>;

export interface GHRepoNode {
  type: GHRepoNodeType;
  sha: GHNodeSha;
  name: string;
  path: string;
  size: number;
}

export interface GHRepoFile extends GHRepoNode {
  type: 'file';
  content: string;
}

// Lo que contesta `/commit`. `committed: false` es «no había nada que guardar»:
// el árbol coincidía con el del padre y no se creó commit.
export interface CommitResult {
  sha: string;
  committed: boolean;
}

export class ShaConflictError extends Error {
  constructor(
    readonly commitMessage: string,
    readonly files: StagedFiles,
    readonly cause: Error,
  ) {
    super(`SHA conflict during commit: ${commitMessage}`);
  }
}

interface GitTreeResponse {
  sha: string;
  tree: GitTreeEntry[];
  truncated: boolean;
}

interface GitTreeEntry {
  path: string;
  mode: string;
  type: 'blob' | 'tree' | 'commit';
  sha: string;
  size: number;
}

interface CachedEntry {
  sha: string;
  content: string;
}

// Persistent SHA + content cache for incremental directory sync
const dirCacheStore = createIdbStore('pensieve-dir-cache', 'entries');

export class GHRepository {
  private readonly rest: GithubRestApi;
  private commiting = false;
  branch = 'main';

  get url() {
    return `/repos/${this.owner}/${this.name}`;
  }

  get isCommiting() {
    return this.commiting;
  }

  constructor(
    readonly token: GithubToken,
    readonly owner: string,
    readonly name: string,
  ) {
    this.rest = new GithubRestApi(token);
  }

  exists() {
    return this.rest.GET(this.url).then(
      () => true,
      () => false,
    );
  }

  async create(description: string, isPrivate: boolean) {
    try {
      await this.rest.POST('/user/repos', {
        name: this.name,
        description,
        homepage: '',
        private: isPrivate,
        visibility: isPrivate ? 'private' : 'public',
        ...CREATE_REPO_CONFIG,
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async createIfNecessary(description: string, isPrivate: boolean) {
    if (await this.exists()) {
      return false;
    }

    await this.create(description, isPrivate);
    return true;
  }

  async readDir(path: string) {
    const dirPath = path.replace(/^\*|\*$/g, '').replace(/\/$/, '');
    const prefix = dirPath + '/';

    // Check if we have cached data
    const cache =
      (await get<Record<string, CachedEntry>>(dirPath, dirCacheStore)) ?? {};
    const hasCachedData = Object.keys(cache).length > 0;
    let tarballFailed = false;

    // Cold start: download tarball (1 API call for everything)
    if (!hasCachedData) {
      try {
        return await this.readDirViaTarball(dirPath, prefix);
      } catch (error) {
        tarballFailed = true;
        console.warn('Tarball download failed, falling back to tree listing:', error);
      }
    }

    // Warm cache: incremental sync via Git Trees API
    try {
      return await this.readDirViaTree(dirPath, prefix, cache);
    } catch (error) {
      // Una caché a medias no es una caché caliente: es lo que deja una carga
      // que se quedó sin rate limit a mitad, y pide tantos ficheros como una
      // vacía. Si esto se rindiera, esa caché no se llenaría nunca —nunca está
      // vacía, así que nunca volvería a pasar por el tarball— y la app se
      // quedaría para siempre leyendo sólo lo local.
      //
      // Si el tarball ya ha fallado en esta misma llamada no se le pide otra
      // vez: rendirse aquí deja la app leyendo lo local, que es lo que toca
      // cuando la única forma de traer tantos ficheros no está disponible.
      if (!(error instanceof TooManyIndividualReads) || tarballFailed) {
        throw error;
      }

      console.warn(`${error.message}; downloading tarball instead`);
      return this.readDirViaTarball(dirPath, prefix);
    }
  }

  // A `/tarball` de la app, no a api.github.com: GitHub redirige a codeload,
  // que no permite este origen (CORS), y el fallback por árbol pedía una nota
  // por petición hasta comerse el rate limit.
  private async readDirViaTarball(
    dirPath: string,
    prefix: string,
  ): Promise<Array<readonly [string, string]>> {
    console.debug(`readDir(${dirPath}): cold start, downloading tarball`);

    const response = await fetch(ghTarballEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: this.token,
        owner: this.owner,
        repo: this.name,
        branch: this.branch,
      }),
    });

    if (!response.ok) {
      throw new Error(`Tarball download failed: ${response.status}`);
    }

    const allFiles = await parseTarball(await response.arrayBuffer());

    // Populate IDB caches for ALL directories at once
    const byDir = new Map<string, Record<string, CachedEntry>>();

    for (const [filePath, { content, sha }] of allFiles) {
      const slashIdx = filePath.indexOf('/');
      if (slashIdx === -1) continue; // root files like settings.json
      const dir = filePath.slice(0, slashIdx);

      if (!byDir.has(dir)) byDir.set(dir, {});
      byDir.get(dir)![filePath] = { sha, content };
    }

    // Persist all directory caches
    await Promise.all(
      Array.from(byDir.entries()).map(([dir, entries]) =>
        set(dir, entries, dirCacheStore),
      ),
    );

    console.debug(
      `readDir(${dirPath}): tarball extracted ${allFiles.size} files across ${byDir.size} directories`,
    );

    // Return only entries matching the requested directory
    const results: Array<readonly [string, string]> = [];
    for (const [filePath, { content }] of allFiles) {
      if (filePath.startsWith(prefix) && !filePath.slice(prefix.length).includes('/')) {
        results.push([filePath, content]);
      }
    }

    return results;
  }

  private async readDirViaTree(
    dirPath: string,
    prefix: string,
    cache: Record<string, CachedEntry>,
  ): Promise<Array<readonly [string, string]>> {
    // List ALL files via Git Trees API (no 1000-file limit)
    const response = await this.rest.GET<GitTreeResponse>(
      `${this.url}/git/trees/${this.branch}?recursive=1`,
    );

    if (response.truncated) {
      console.warn('Git tree response was truncated — some files may be missing');
    }

    // Filter to only blobs (files) in the requested directory (direct children)
    const listing = response.tree.filter(
      e => e.type === 'blob' && e.path.startsWith(prefix) && !e.path.slice(prefix.length).includes('/'),
    );

    // Determine which files need fetching
    const results: Array<readonly [string, string]> = [];
    const toFetch: GitTreeEntry[] = [];

    for (const entry of listing) {
      const cached = cache[entry.path];
      if (cached && cached.sha === entry.sha) {
        results.push([entry.path, cached.content]);
      } else {
        toFetch.push(entry);
      }
    }

    console.debug(
      `readDir(${dirPath}): ${listing.length} files, ${results.length} cached, ${toFetch.length} to fetch`,
    );

    if (toFetch.length > MAX_INDIVIDUAL_FETCHES) {
      throw new TooManyIndividualReads(
        `readDir(${dirPath}) needs ${toFetch.length} individual reads ` +
          `(max ${MAX_INDIVIDUAL_FETCHES})`,
      );
    }

    // Fetch changed files in parallel batches
    for (let i = 0; i < toFetch.length; i += FETCH_BATCH_SIZE) {
      const batch = toFetch.slice(i, i + FETCH_BATCH_SIZE);
      const batchResults = await Promise.all(
        // `requestFile`, no `readFile`: lo que se guarda aquí queda apuntado con
        // el SHA nuevo, y si viniera de la caché el contenido viejo se quedaría
        // marcado como al día y no se volvería a pedir nunca.
        batch.map(async ({ path, sha }) => {
          const content = await this.requestFile(path);
          cache[path] = { sha, content };
          return [path, content] as const;
        }),
      );
      results.push(...batchResults);
    }

    // Remove deleted files from cache
    for (const cachedPath of Object.keys(cache)) {
      if (!listing.some(e => e.path === cachedPath)) {
        delete cache[cachedPath];
      }
    }

    // Persist updated cache
    await set(dirPath, cache, dirCacheStore);

    return results;
  }

  getReadme() {
    return this.rest.GET<string>(`${this.url}/readme`, {
      mediaType: MediaType.Raw,
    });
  }

  // El tarball baja el contenido de **todas** las notas y lo deja en la caché de
  // directorios, así que cuando GitHub no contesta —rate limit agotado, sin red,
  // token caducado— el contenido ya está en disco. Sin esto la app tiene la nota
  // guardada y aun así abre el editor vacío, que es lo mismo que perderla.
  async readFile(path: string): Promise<string> {
    try {
      return await this.requestFile(path);
    } catch (error) {
      const cached = await this.readFileFromDirCache(path);

      if (cached == null) {
        throw error;
      }

      console.warn(`readFile(${path}) failed, serving cached copy:`, error);
      return cached;
    }
  }

  private async requestFile(path: string): Promise<string> {
    const file = await this.rest.GET<string | GHApiRepositoryNode[]>(
      `${this.url}/contents/${path}`,
      { mediaType: MediaType.Raw },
    );

    if (Array.isArray(file)) {
      throw new Error(`${this.url}/${path} is a directory`);
    }

    return file;
  }

  private async readFileFromDirCache(path: string) {
    const slashIdx = path.indexOf('/');

    if (slashIdx === -1) {
      return null;
    }

    const cache = await get<Record<string, CachedEntry>>(
      path.slice(0, slashIdx),
      dirCacheStore,
    ).catch(() => null);

    return cache?.[path]?.content ?? null;
  }

  async writeFile(path: string, content: string, message: string) {
    await this.rest.PUT(`${this.url}/contents/${path}`, { message, content });
  }

  async commit(message: string, files: StagedFiles, isUrgent = false) {
    const { owner: username, name, branch, token } = this;
    const body = {
      token,
      owner: username,
      repo: name,
      branch,
      files,
      message,
    };

    this.commiting = true;

    try {
      return await POST<CommitResult>(ghCommitEndpoint, body, {
        keepalive: isUrgent,
      });
    } catch (error) {
      if (error instanceof HttpError && (error.status === 409 || error.status === 422)) {
        throw new ShaConflictError(message, files, error);
      }
      throw error;
    } finally {
      this.commiting = false;
    }
  }

  async readFileCool(path: string, keys: string) {
    const response = await githubGraphql(this.token,
      getFileProperty(keys),
      this.getFileVars(path),
    );

    return response.data.repository.file?.text as string;
  }

  private getFileVars(path: string) {
    return {
      owner: this.owner,
      repo: this.name,
      path: `${this.branch}:${path}`,
    };
  }
}

const requestLimit = localStorage.getItem('gh-req-limit') || 5000;

function getFileProperty(keys: string) {
  return `
    repository(owner: $owner, name: $repo) {
      object(expression: $path, limit: ${requestLimit}) {
        ... on Blob {
          ${keys}
        }
      }
    }
  `;
}
