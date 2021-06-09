import { GithubApi, GithubToken } from './GithubApi';
import { GithubSha } from './GithubSha';
import { RepositoryFile } from './RepositoryFile';

// This is necessary because of https://github.com/microsoft/TypeScript/issues/14174#issuecomment-856812565
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type StagedFiles = Record<string, any>;

interface Ref {
  data: {
    object: {
      sha: GithubSha;
    };
  };
}

interface ShaResponse {
  data: {
    sha: GithubSha;
  };
}

export interface GithubRepositoryFile {
  sha: GithubSha;
  name: string;
  path: string;
  size: number;
  content: string;
}

export interface GithubRepositoryJsonFile<T> {
  sha: GithubSha;
  name: string;
  path: string;
  size: number;
  content: string;
  json: T;
}

export class GithubRepository extends GithubApi {
  get url() {
    return `/repos/${this.username}/${this.name}`;
  }

  constructor(
    token: GithubToken,
    readonly username: string,
    readonly name: string,
  ) {
    super(token);
  }

  async readFile(path: string): Promise<GithubRepositoryFile> {
    const file = await this.GET<RepositoryFile>(`${this.url}/contents/${path}`);
    const content = atob(file.content);
    const { name, sha, size } = file;
    return { name, path, sha, size, content };
  }

  async readJsonFile<T>(path: string): Promise<GithubRepositoryJsonFile<T>> {
    const file = await this.readFile(path);
    const json = JSON.parse(file.content) as T;
    return { ...file, json };
  }

  async commit(message: string, files: Staged) {
    // Get a reference
    // https://docs.github.com/en/free-pro-team@latest/rest/reference/git#update-a-reference
    const ref = await this.GET<Ref>(`${this.url}/git/refs/heads/master`);

    const items = Object.entries(files)
      .map(([path, content]) => {
        if (content == null) {
          // delete file
          return { path, sha: null };
        }

        if (typeof content === 'string') {
          return { path, content };
        }

        return { path, content: JSON.stringify(content, null, 2) };
      })
      .map(x => ({ ...x, mode: '100644', type: 'blob' }));

    // Create tree
    // https://docs.github.com/en/free-pro-team@latest/rest/reference/git#create-a-tree
    const tree = await this.POST<ShaResponse>(`${this.url}/git/trees`, {
      tree: items,
      base_tree: ref.data.object.sha,
    });

    // Create commit
    // https://docs.github.com/en/free-pro-team@latest/rest/reference/git#create-a-commit
    const commit = await this.POST<ShaResponse>(`${this.url}/git/commits`, {
      message,
      tree: tree.data.sha,
      parents: [ref.data.object.sha],
    });

    // Update a reference
    // https://docs.github.com/en/free-pro-team@latest/rest/reference/git#update-a-reference
    await this.POST(`${this.url}/git/refs/heads/master`, {
      sha: commit.data.sha,
      force: true,
    });
  }
}
