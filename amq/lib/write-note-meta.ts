// Reescribe meta/{id}.json con lo que dice la primera línea de la nota, e
// imprime el título viejo y el nuevo separados por un tabulador.
//
// `amq pensieve edit` llama aquí en vez de repetir la lógica en bash: ésta es
// la parte que *escribe* metadata, y una copia que divergiera dejaría al meta/
// diciendo un nombre y a la nota otro.
import { readFileSync, writeFileSync } from 'node:fs';
import { getMetadataFromContent } from '../../src/2-entities/getMetadataFromContent.ts';
import { datestr } from '../../src/util/datestr.ts';

const [metaPath, notePath] = process.argv.slice(2);

if (!metaPath || !notePath) {
  console.error('uso: write-note-meta.ts <meta/{id}.json> <note/{id}>');
  process.exit(1);
}

const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
const { title, group } = getMetadataFromContent(readFileSync(notePath, 'utf8'));

// El mismo spread que la app: los campos que este comando no decide —`id`,
// `created`, `favorite`, `bumped`— se copian con su orden intacto, y un `group`
// indefinido (una nota sin `/`) desaparece del JSON en vez de valer null.
const updated = { ...meta, title, group, modified: datestr() };

// Sin salto final y con dos espacios de sangría, que es lo que escribe la app.
writeFileSync(metaPath, JSON.stringify(updated, null, 2));

process.stdout.write(`${meta.title}\t${title}\n`);
