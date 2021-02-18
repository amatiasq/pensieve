import './InputField.scss';

import React, { createRef, useEffect, useState } from 'react';

import {
  clearSelection,
  selectElementContents
} from '../../dom/selectElementContents';

export function InputField({
  className,
  value,
  readonly,
  forceEditMode,
  submitIfNotModified,
  scrollIntoView,
  onSubmit,
  onAbort,
}: {
  className?: string;
  value: string;
  readonly?: boolean;
  forceEditMode?: boolean;
  submitIfNotModified?: boolean;
  scrollIntoView?: boolean;
  onSubmit(value: string, prev: string): void;
  onAbort?(): void;
}) {
  const [content, setContent] = useState(value);
  const [isEditing, setIsEditing] = useState(forceEditMode || false);
  const ref = createRef<HTMLSpanElement>();
  const cn = `input-field ${className} ${isEditing ? 'editing' : ''}`;

  useEffect(resetContent, [value, ref.current]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (readonly || !isEditing) {
      return;
    }

    if (scrollIntoView) {
      el.scrollIntoView();
    }

    el.focus();
    selectElementContents(el);

    // HACK: selection doesn't work on newly created elements
    setTimeout(() => {
      selectElementContents(el);
    }, 10);
  }, [!readonly && isEditing]);

  return (
    <span
      ref={ref}
      role="textbox"
      className={cn}
      contentEditable={isEditing}
      onDoubleClick={() => setIsEditing(true)}
      onInput={onInput}
      onKeyDown={onKeyDown}
      onBlur={submit}
    />
  );

  function submit() {
    if (content !== value || submitIfNotModified) {
      onSubmit(content, value);
    } else if (onAbort) {
      onAbort();
    }

    setIsEditing(false);
  }

  function onInput(event: React.FormEvent<HTMLSpanElement>) {
    setContent((event.target as HTMLSpanElement).innerText);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      submit();
    }

    if (event.key === 'Escape') {
      setIsEditing(false);
      resetContent();

      if (onAbort) {
        onAbort();
      }
    }
  }

  function resetContent() {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    ref.current!.innerText = value;
  }
}
