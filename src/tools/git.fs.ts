import FS from '@isomorphic-git/lightning-fs';

export const gitFs = new FS('fs');
const fs = gitFs.promises;

export async function mkdirRecursive(path: string) {
  for (
    let index = path.indexOf('/', 1);
    index != -1;
    index = path.indexOf('/', index + 1)
  ) {
    await mkdirIfDoesntExist(path.substring(0, index + 1));
  }

  await mkdirIfDoesntExist(path);
}

async function mkdirIfDoesntExist(path: string) {
  try {
    const stat = await fs.lstat(path);
    if (stat.isDirectory()) return console.log('Exists', path);
  } catch {}

  await fs.mkdir(path);
}

export async function getAllFiles(path: string): Promise<string[]> {
  try {
    const stat = await fs.lstat(path);

    if (!stat.isDirectory()) return [path];

    const result = [];

    for (const child of await fs.readdir(path)) {
      const children = await getAllFiles(
        `${path}/${child}`.replace(/\/\//, '/')
      );
      result.push(...children);
    }

    return result;
  } catch (error) {
    console.error(`Error listing ${path}`, error);
    throw error;
  }
}
