import React from 'react';
import Editor from '@monaco-editor/react';

export function EditScript() {
  return (
    <div style={{ overflow: 'hidden' }}>
      <Editor
        height="100vh"
        theme="vs-dark"
        defaultLanguage="javascript"
        defaultValue="console.log('potato')"
        onChange={x => console.log(x)}
      />
    </div>
  );
}
