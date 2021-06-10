import './NoteEditor.scss';

import React, { useContext, useEffect, useState } from 'react';

import { registerCommand } from '../../1-core/commands';
import { DEFAULT_FILE_CONTENT } from '../../2-github/github_api';
import { AppStorageContext } from '../../5-app/contexts';
import { useScheduler } from '../../6-hooks/useScheduler';
import { useSetting } from '../../6-hooks/useSetting';
import { useStack } from '../../6-hooks/useStack';
import { Note, NoteContent } from '../../entities/Note';
import { BusinessIndicator } from '../atoms/BusinessIndicator';
import { ContentEditor } from './ContentEditor';

export function NoteEditor({ note, content }: { note: Note; content: NoteContent }) {
  const store = useContext(AppStorageContext);
  const autosave = useSetting('autosave')[0] || 0;
  const [saved, addSaved] = useStack<string>(5, content);
  const [value, setValue] = useState<string>(content);

  registerCommand('save', () => save(value));

  const scheduler = useScheduler(autosave * 1000, () => {
    if (autosave !== 0 && content !== value) {
      save(value);
    }
  });

  useEffect(() => {
    // eslint-disable-next-line no-irregular-whitespace
    document.title = `${note.title}  ✏️  Gists`;
  }, [note.title]);

  useEffect(() => {
    if (value !== content && !saved.includes(content)) {
      setValue(content);
    }
  }, [content]);

  useEffect(() => {
    const handler = () => save(value);
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  });

  // useEffect(() => history.listen(x => {
  //   if (x.pathname !== file.path) {
  //     save(value);
  //   }
  // }));

  if (value == null) return <p>Loading...</p>;

  return (
    <main className="note-editor">
      <ContentEditor value={value} onChange={onChange} />
      <BusinessIndicator />
    </main>
  );

  function onChange(value?: string) {
    setValue(value || '');
    scheduler.restart();
  }

  function save(value: string | null) {
    scheduler.stop();
    const content = value || DEFAULT_FILE_CONTENT;
    addSaved(content);
    return store.writeNoteContent(note.id, content);
  }
}
