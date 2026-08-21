const BLOCK_SIZE = 512;

// Los typeflag del tar que salen en un tarball de GitHub.
const TYPE_FILE_OLD = 0; // '\0', tar antiguo
const TYPE_FILE = 48; // '0'
const TYPE_PAX_EXTENDED = 120; // 'x', cabecera pax de la entrada siguiente
const TYPE_GNU_LONGNAME = 76; // 'L', el @LongLink de GNU tar

export interface TarballEntry {
  readonly content: string;
  /**
   * El mismo SHA que `git hash-object`: deja la caché comparable con el
   * `git/trees` de la siguiente sincronización — con un hash inventado nada
   * coincidía y el repo volvía a bajarse fichero a fichero.
   */
  readonly sha: string;
}

/**
 * Parse a .tar.gz ArrayBuffer into a Map of file paths → content and git SHA.
 * Uses native DecompressionStream (no dependencies).
 * Strips the root directory prefix added by GitHub tarballs.
 */
export async function parseTarball(
  gzipped: ArrayBuffer,
): Promise<Map<string, TarballEntry>> {
  const tarBuffer = await decompress(gzipped);
  const files = new Map<string, TarballEntry>();
  const view = new Uint8Array(tarBuffer);
  let offset = 0;
  // La ruta que ha anunciado una cabecera pax para la entrada siguiente.
  let announcedPath: string | null = null;

  while (offset + BLOCK_SIZE <= view.length) {
    // Empty block signals end of archive
    if (view[offset] === 0) break;

    const name = readString(view, offset, 100);
    const sizeOctal = readString(view, offset + 124, 12);
    const typeFlag = view[offset + 156];
    const prefix = readString(view, offset + 345, 155);

    const size = parseInt(sizeOctal, 8) || 0;

    // Move past the header to the file content
    offset += BLOCK_SIZE;
    const body = view.slice(offset, offset + size);
    // Advance past the content (padded to 512-byte boundary)
    offset += Math.ceil(size / BLOCK_SIZE) * BLOCK_SIZE;

    // El campo `name` del tar son 100 bytes, así que una ruta más larga no cabe
    // y git la manda aparte, en una cabecera pax con un registro `path=`. Sin
    // leerla, la entrada siguiente se quedaba con el nombre de relleno que puso
    // git —`<sha>.data`— y la nota desaparecía de la lista: su fichero estaba
    // en la caché, pero bajo una clave que no es `meta/…`.
    if (typeFlag === TYPE_PAX_EXTENDED) {
      announcedPath = readPaxPath(body) ?? announcedPath;
      continue;
    }

    if (typeFlag === TYPE_GNU_LONGNAME) {
      announcedPath = decode(body).replace(/\0+$/, '');
      continue;
    }

    // Lo anunciado vale para esta entrada y sólo para ésta, sea la que sea: si
    // se dejara puesto, se lo quedaría la de después.
    const announced = announcedPath;
    announcedPath = null;

    if (typeFlag !== TYPE_FILE && typeFlag !== TYPE_FILE_OLD) {
      continue;
    }

    const fullPath = announced ?? (prefix ? `${prefix}/${name}` : name);

    // Strip the root directory prefix (e.g. "owner-repo-sha/")
    const stripped = fullPath.replace(/^[^/]+\//, '');

    if (stripped) {
      files.set(stripped, {
        // El SHA sale de los bytes del tar, no del texto decodificado: es el
        // mismo dato que hasheó git.
        content: decode(body),
        sha: await gitBlobSha(body),
      });
    }
  }

  return files;
}

/** `sha1("blob " + tamaño + "\0" + contenido)`, que es como hashea git. */
async function gitBlobSha(bytes: Uint8Array): Promise<string> {
  const header = new TextEncoder().encode(`blob ${bytes.length}\0`);
  const payload = new Uint8Array(header.length + bytes.length);

  payload.set(header, 0);
  payload.set(bytes, header.length);

  const digest = await crypto.subtle.digest('SHA-1', payload);

  return Array.from(new Uint8Array(digest))
    .map(x => x.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Una cabecera pax son registros `<longitud> <clave>=<valor>\n`, y aquí sólo
 * interesa `path`. La longitud se cuenta en bytes, no en caracteres, así que el
 * troceado va sobre los bytes: estas rutas llevan acentos.
 */
function readPaxPath(body: Uint8Array): string | null {
  let cursor = 0;

  while (cursor < body.length) {
    const space = body.indexOf(0x20, cursor);
    if (space === -1) return null;

    const length = parseInt(decode(body.slice(cursor, space)), 10);
    if (!length || cursor + length > body.length) return null;

    const record = decode(body.slice(space + 1, cursor + length));
    const equals = record.indexOf('=');

    if (equals !== -1 && record.slice(0, equals) === 'path') {
      return record.slice(equals + 1).replace(/\n$/, '');
    }

    cursor += length;
  }

  return null;
}

function decode(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
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
