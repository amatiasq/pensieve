import React, { createRef, useEffect, useState } from 'react';

import { escapeHtml } from '../../util/escapeHtml';
import { selectElementContents } from '../../util/selectElementContents';

export function InputField({
  className,
  value,
  editable,
  onSubmit,
  onAbort,
}: {
  className?: string;
  value: string;
  editable: boolean;
  onSubmit(value: string): void;
  onAbort(): void;
}) {
  const [content, setContent] = useState(value);
  const submit = () => (content !== value ? onSubmit(content) : onAbort());
  const ref = createRef<HTMLSpanElement>();

  useEffect(() => {
    const el = ref.current;

    if (editable && el) {
      el.focus();
      selectElementContents(el);

      // HACK: selection doesn't work on newly created elements
      setTimeout(() => {
        selectElementContents(el);
      }, 10);
    }
  }, [editable]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    ref.current!.innerText = value;
  }, [ref.current]);

  return (
    <span
      ref={ref}
      role="textbox"
      className={className}
      contentEditable={editable}
      onInput={onInput}
      onKeyDown={onKeyDown}
      onBlur={submit}
    />
  );

  function onInput(event: React.FormEvent<HTMLSpanElement>) {
    setContent((event.target as HTMLSpanElement).innerText);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      submit();
    }

    if (event.key === 'Escape') {
      onAbort();
    }
  }
}
