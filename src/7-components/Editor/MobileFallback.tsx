import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { useMonaco } from '@monaco-editor/react';
import { createRef, useEffect, useState } from 'react';
import { useSetting } from '../../6-hooks/useSetting';
import { hideScrollbar } from '../styles';
import { extendMonaco } from './monaco/extendMonaco';
import { theme } from './monacoConfiguration';

const Fallback = css`
  box-sizing: border-box;
  padding: 24px;
  height: 100vh;
  --toolbar-height: 0px;
`;

const Preview = styled.pre`
  ${Fallback}
  ${hideScrollbar}
  font-size: 13px;
  line-height: 1.15rem;
  overflow: auto;
`;

const Textarea = styled.textarea`
  ${Fallback}
  appearance: none;
  border: none;
  outline: none;
  padding: 8px;
  background-color: #1c1c1c;
  color: inherit;
  width: 100%;
  // height: calc(100vh - var(--toolbar-height));
  padding: 32px;
  box-sizing: border-box;
`;

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
      <Textarea
        ref={x => x?.style.setProperty('--toolbar-height', `${gap || 0}px`)}
        defaultValue={value}
        readOnly={readonly}
        autoFocus={autofocus}
        autoComplete=""
        onChange={e => onChange(e.target.value)}
      />
    );
  }

  return (
    <Preview onClick={() => setIsPreview(false)}>
      <code ref={ref} lang={language} data-lang={language}>
        {value}
      </code>
    </Preview>
  );
}
