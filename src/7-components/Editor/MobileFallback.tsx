import './MobileFallback.scss';

import React, { createRef, useEffect, useState } from 'react';

import { useMonaco } from '@monaco-editor/react';

// import MarkdownPreview from '@uiw/react-markdown-preview';

export interface MobileFallbackProps {
  language: string;
  value: string;
  gap?: string;
  readonly?: boolean;
  autofocus: boolean;
  onChange: (newValue: string | undefined) => void;
}

export function MobileFallback({
  language,
  value,
  gap,
  readonly,
  autofocus,
  onChange,
}: MobileFallbackProps) {
  const ref = createRef<HTMLElement>();
  const monaco = useMonaco();
  const [isPreview, setIsPreview] = useState(true);

  useEffect(() => {
    if (monaco && ref.current) {
      monaco.editor.colorizeElement(ref.current, {
        theme: 'vs-dark',
      });
    }
  }, [monaco, ref.current]);

  if (!isPreview) {
    return (
      <textarea
        ref={x => x?.style.setProperty('--toolbar-height', `${gap || 0}px`)}
        className="mobile-fallback mobile-fallback--textarea"
        defaultValue={value}
        readOnly={readonly}
        autoFocus={autofocus}
        autoComplete=""
        onChange={e => onChange(e.target.value)}
      ></textarea>
    );
  }

  // if (language === 'markdown') {
  //   return (
  //     <div
  //       className="mobile-fallback mobile-fallback--markdown"
  //       onClick={() => setIsPreview(false)}
  //     >
  //       <MarkdownPreview className="mobile-fallback--renderer" source={value} />
  //     </div>
  //   );
  // }

  return (
    <pre
      className="mobile-fallback mobile-fallback--code"
      onClick={() => setIsPreview(false)}
    >
      <code ref={ref} lang={language} data-lang={language}>
        {value}
      </code>
    </pre>
  );
}
