import { GithubApi } from './GithubApi';
import { GithubToken } from './GithubAuth';
import { GHApiCommit } from './models/GHApiCommit';
import { GHApiRef } from './models/GHApiRef';
import {
  GHApiRepositoryNode,
  GHNodeSha,
  GHRepoNodeType
} from './models/GHApiRepositoryNode';
import { GHApiTree } from './models/GHApiTree';

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

// This is necessary because of https://github.com/microsoft/TypeScript/issues/14174#issuecomment-856812565
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export class GHRepositoryApi extends GithubApi {
  branch = 'master';

  get url() {
    return `/repos/${this.username}/${this.name}`;
  }

  constructor(token: GithubToken, readonly username: string, readonly name: string) {
    super(token);
  }

  exists() {
    return this.GET(this.url).then(
      () => true,
      () => false,
    );
  }

  async create(description: string, isPrivate: boolean) {
    try {
      await this.POST('/user/repos', {
        name: this.name,
        description,
        homepage: '',
        // private: isPrivate,
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

  async fetchStructure() {
    const ref = await this.GET<GHApiRef>(`${this.url}/git/refs/heads/${this.branch}`);
    const commit = await this.GET<GHApiCommit>(`${this.url}/git/commits/${ref.object.sha}`);
    const tree = await this.GET<GHApiTree>(`${this.url}/git/trees/${commit.tree.sha}?recursive=1`);
    return tree.tree.map(simplifyNode);
  }

  async readDir(path: string) {
    const content = await this.GET<GHApiRepositoryNode[]>(`${this.url}/contents/${path}`);
    return content.map(simplifyNode);
  }

  async readFile(path: string): Promise<GHRepoFile> {
    const file = await this.GET<GHApiRepositoryNode>(`${this.url}/contents/${path}`);

    if (Array.isArray(file)) {
      throw new Error(`${this.url}/${path} is a directory`);
    }

    if (file.type !== 'file') {
      throw new Error(`${this.url}/${path} is not a file: ${file.type}`);
    }

    const content = atob(file.content);
    return { ...simplifyNode(file), type: 'file', content };
  }

  async commit(message: string, files: StagedFiles) {
    // Get a reference
    // https://docs.github.com/en/free-pro-team@latest/rest/reference/git#update-a-reference
    const ref = await this.GET<GHApiRef>(`${this.url}/git/refs/heads/${this.branch}`);

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
    const tree = await this.POST<GHApiTree>(`${this.url}/git/trees`, {
      tree: items,
      base_tree: ref.object.sha,
    });

    // Create commit
    // https://docs.github.com/en/free-pro-team@latest/rest/reference/git#create-a-commit
    const commit = await this.POST<GHApiCommit>(`${this.url}/git/commits`, {
      message,
      tree: tree.sha,
      parents: [ref.object.sha],
    });

    // Update a reference
    // https://docs.github.com/en/free-pro-team@latest/rest/reference/git#update-a-reference
    await this.POST(`${this.url}/git/refs/heads/${this.branch}`, {
      sha: commit.sha,
      force: true,
    });
  }
}

function simplifyNode({ type, size, path, sha }: Pick<GHApiRepositoryNode, 'type' | 'size' | 'path' | 'sha'>) {
  return { type, size, path, sha } as GHRepoNode;
}
