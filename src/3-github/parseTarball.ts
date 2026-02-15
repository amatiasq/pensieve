const BLOCK_SIZE = 512;

/**
 * Parse a .tar.gz ArrayBuffer into a Map of file paths → text content.
 * Uses native DecompressionStream (no dependencies).
 * Strips the root directory prefix added by GitHub tarballs.
 */
export async function parseTarball(
  gzipped: ArrayBuffer,
): Promise<Map<string, string>> {
  const tarBuffer = await decompress(gzipped);
  const files = new Map<string, string>();
  const view = new Uint8Array(tarBuffer);
  let offset = 0;

  while (offset + BLOCK_SIZE <= view.length) {
    // Empty block signals end of archive
    if (view[offset] === 0) break;

    const name = readString(view, offset, 100);
    const sizeOctal = readString(view, offset + 124, 12);
    const typeFlag = view[offset + 156];
    const prefix = readString(view, offset + 345, 155);

    const size = parseInt(sizeOctal, 8) || 0;
    const fullPath = prefix ? `${prefix}/${name}` : name;

    // Move past the header to the file content
    offset += BLOCK_SIZE;

    // Type '0' or '\0' = regular file
    if ((typeFlag === 48 || typeFlag === 0) && size > 0) {
      const content = new TextDecoder().decode(
        view.slice(offset, offset + size),
      );

      // Strip the root directory prefix (e.g. "owner-repo-sha/")
      const stripped = fullPath.replace(/^[^/]+\//, '');
      if (stripped) {
        files.set(stripped, content);
      }
    }

    // Advance past the content (padded to 512-byte boundary)
    offset += Math.ceil(size / BLOCK_SIZE) * BLOCK_SIZE;
  }

  return files;
}

function readString(view: Uint8Array, offset: number, length: number): string {
  let end = offset;
  while (end < offset + length && view[end] !== 0) end++;
  return new TextDecoder().decode(view.slice(offset, end));
}

async function decompress(gzipped: ArrayBuffer): Promise<ArrayBuffer> {
  const stream = new Blob([gzipped])
    .stream()
    .pipeThrough(new DecompressionStream('gzip'));
  return new Response(stream).arrayBuffer();
}
