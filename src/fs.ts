import FS from '@isomorphic-git/lightning-fs';

const shittyFs = new FS('fs');
const fs = shittyFs.promises;

export function getFrontendFs() {
  return shittyFs;
}

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
