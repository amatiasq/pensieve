import React, { useContext, useEffect, useState } from 'react';

import { registerCommand } from '../../1-core/commands';
import { Note, NoteContent } from '../../2-entities/Note';
import { AppStorageContext } from '../../5-app/contexts';
import { useNavigator } from '../../6-hooks/useNavigator';
import { useScheduler } from '../../6-hooks/useScheduler';
import { useSetting } from '../../6-hooks/useSetting';
// import { useStack } from '../../6-hooks/useStack';
import { BusinessIndicator } from '../atoms/BusinessIndicator';
import { Loader } from '../atoms/Loader';
import { ContentEditor } from './ContentEditor';

export function NoteEditor({
  note,
  content,
}: {
  note: Note;
  content: NoteContent;
}) {
  const store = useContext(AppStorageContext);
  const autosave = useSetting('autosave')[0] || 0;
  const navigator = useNavigator();
  // const [saved, addSaved] = useStack<string>(5, content);
  const [value, setValue] = useState<string>(content);

  registerCommand('save', () => save(value));

  const scheduler = useScheduler(autosave * 1000, () => {
    if (autosave !== 0 && content !== value) {
      save(value);
    }
  });

  useEffect(() =>
    navigator.onNavigate(next => {
      if (!next.isNote(note) && content !== value) {
        save(value);
      }
    }),
  );

  useEffect(() => {
    // eslint-disable-next-line no-irregular-whitespace
    document.title = `${note.title}  ✏️  Gists`;
  }, [note.title]);

  useEffect(() => {
    if (value !== content) {
      // && !saved.includes(content)) {
      setValue(content);
    }
  }, [content]);

  useEffect(() => {
    const handler = () => save(value, true);
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  });

  if (value == null) return <Loader />;

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

  function save(value: string, urgent = false) {
    scheduler.stop();
    // addSaved(value);
    return store.setNoteContent(note.id, value, { urgent });
  }
}
