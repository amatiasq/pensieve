import { useEffect, useRef } from 'react';
import { onPageActive } from '../0-dom/page-lifecycle.ts';
import { useScheduler } from './useScheduler.ts';
import { useSetting } from './useSetting.ts';
import { useShortcut } from './useShortcut.ts';

interface AutosaveOptions {
  hasUnsavedChanges: boolean;
  save(options: { urgent: boolean }): void;
}

// El guardado entero del editor: el debounce, el autosave programado, el
// urgente al ocultarse la pestaña, el atajo de teclado y el volcado al
// desmontarse. El editor sólo pone `save` y avisa de cada edición.
export function useAutosave({ hasUnsavedChanges, save }: AutosaveOptions) {
  const autosave = useSetting('autosave')[0] || 0;
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const doSave = ({ urgent = false } = {}) => {
    scheduler.stop();
    save({ urgent });
  };

  const saveIfUnsaved = ({ urgent = false } = {}) => {
    if (hasUnsavedChanges) doSave({ urgent });
  };

  const requestSave = () => {
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => saveIfUnsaved(), 100);
  };

  const scheduler = useScheduler(autosave * 1000, () => {
    if (autosave !== 0) {
      requestSave();
    }
  });

  // Lo pendiente se vuelca al desmontarse, con el cierre del último render, que
  // es el único que sabe qué se estaba editando. Un temporizador que sobrevive
  // al editor guarda con el `save` del editor siguiente, o sea en otra nota.
  const pending = useRef(saveIfUnsaved);
  pending.current = saveIfUnsaved;

  useEffect(
    () => () => {
      clearTimeout(debounceTimer.current);
      scheduler.stop();
      pending.current();
    },
    [],
  );

  useShortcut('save', () => doSave());

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const sus = onPageActive.subscribe(active => {
      if (!active) saveIfUnsaved({ urgent: true });
    });

    return () => {
      sus.unsubscribe();
    };
  });

  return { onUserEdit: () => scheduler.restart() };
}
