import { DataSource } from './DataSource';

export class NotesService {
  constructor(private readonly source: DataSource) {}

  async init() {
    this.notes = this.source.fetchNotes();
  }
}
