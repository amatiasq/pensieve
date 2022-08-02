import { useMonaco } from '@monaco-editor/react';
import { createRef, useEffect, useState } from 'react';
import { useSetting } from '../../6-hooks/useSetting';
import './MobileFallback.scss';
import { extendMonaco } from './monaco/extendMonaco';
import { theme } from './monacoConfiguration';

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
  const [links] = useSetting('links');
  const [highlight] = useSetting('highlight');
  const [isPreview, setIsPreview] = useState(true);

  useEffect(() => {
    if (monaco) {
      extendMonaco(monaco, highlight, links);
    }
  }, [monaco, highlight, links]);

  useEffect(() => {
    if (monaco && ref.current) {
      monaco.editor.colorizeElement(ref.current, {
        theme: theme,
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
