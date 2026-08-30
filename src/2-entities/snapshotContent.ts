import { daystr } from '../util/datestr.ts';
import { getMetadataFromContent } from './getMetadataFromContent.ts';
import type { NoteContent } from './Note.ts';

// `Carpeta - nombre` es cómo se saca una nota de su carpeta para verla con la
// carpeta cerrada, así que el snapshot conserva el prefijo y se queda al lado.
const PREFIX_SEPARATOR = ' - ';

// El nombre de una nota es su primera línea, así que un snapshot es la misma
// nota con otro nombre: la carpeta de la original y el día de hoy.
export function snapshotContent(
  content: NoteContent,
  date = new Date(),
): NoteContent {
  const { group, title } = getMetadataFromContent(content);
  const folder = group ? `${group} / ` : '';
  return `# ${folder}${prefixOf(title)}${daystr(date)}${bodyOf(content)}`;
}

function prefixOf(title: string) {
  const separator = title.indexOf(PREFIX_SEPARATOR);
  return separator === -1
    ? ''
    : title.slice(0, separator + PREFIX_SEPARATOR.length);
}

function bodyOf(content: NoteContent) {
  const firstLine = content.length - content.trimStart().length;
  const lineBreak = content.indexOf('\n', firstLine);
  return lineBreak === -1 ? '\n' : content.slice(lineBreak);
}
