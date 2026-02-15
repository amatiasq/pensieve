import {
  createStore as createIdbStore,
  get,
  set,
} from 'idb-keyval';
import { HttpError, POST } from '../1-core/http.ts';
import { ghAuthHeaders, ghCommitEndpoint, ghUrl } from './gh-utils.ts';
import { parseTarball } from './parseTarball.ts';
import { GithubToken } from './GithubAuth.ts';
import { GithubGraphQlApi } from './GithubGraphQlApi.ts';
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
  private readonly gql: GithubGraphQlApi;
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
    this.gql = new GithubGraphQlApi(token);
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

    // Cold start: download tarball (1 API call for everything)
    if (!hasCachedData) {
      try {
        return await this.readDirViaTarball(dirPath, prefix);
      } catch (error) {
        console.warn('Tarball download failed, falling back to tree listing:', error);
      }
    }

    // Warm cache: incremental sync via Git Trees API
    return this.readDirViaTree(dirPath, prefix, cache);
  }

  private async readDirViaTarball(
    dirPath: string,
    prefix: string,
  ): Promise<Array<readonly [string, string]>> {
    console.debug(`readDir(${dirPath}): cold start, downloading tarball`);

    const response = await fetch(
      ghUrl(`${this.url}/tarball/${this.branch}`),
      { headers: ghAuthHeaders(this.token) },
    );

    if (!response.ok) {
      throw new Error(`Tarball download failed: ${response.status}`);
    }

    const allFiles = await parseTarball(await response.arrayBuffer());

    // Populate IDB caches for ALL directories at once
    const byDir = new Map<string, Record<string, CachedEntry>>();

    for (const [filePath, content] of allFiles) {
      const slashIdx = filePath.indexOf('/');
      if (slashIdx === -1) continue; // root files like settings.json
      const dir = filePath.slice(0, slashIdx);

      if (!byDir.has(dir)) byDir.set(dir, {});
      // Use content hash as SHA placeholder for cache invalidation
      byDir.get(dir)![filePath] = { sha: simpleHash(content), content };
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
    for (const [filePath, content] of allFiles) {
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

    // Fetch changed files in parallel batches
    for (let i = 0; i < toFetch.length; i += FETCH_BATCH_SIZE) {
      const batch = toFetch.slice(i, i + FETCH_BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(async ({ path, sha }) => {
          const content = await this.readFile(path);
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

  async readFile(path: string): Promise<string> {
    const file = await this.rest.GET<string | GHApiRepositoryNode[]>(
      `${this.url}/contents/${path}`,
      { mediaType: MediaType.Raw },
    );

    if (Array.isArray(file)) {
      throw new Error(`${this.url}/${path} is a directory`);
    }

    return file;
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
      return await POST<void>(ghCommitEndpoint, body, { keepalive: isUrgent });
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
    const response = await this.gql.send(
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

/** Simple hash for tarball cache entries (no real git SHA available) */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
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
