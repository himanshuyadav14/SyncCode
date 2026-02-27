"use client";

import Editor, { type OnChange, type OnMount } from "@monaco-editor/react";

interface MonacoEditorWrapperProps {
  code: string;
  language: string;
  onChange: OnChange;
  onMount: OnMount;
}

export default function MonacoEditorWrapper({
  code,
  language,
  onChange,
  onMount,
}: MonacoEditorWrapperProps) {
  return (
    <Editor
      height="100%"
      language={language}
      value={code}
      theme="vs-dark"
      onChange={onChange}
      onMount={onMount}
      options={{
        fontSize: 14,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
        fontLigatures: true,
        minimap: { enabled: true },
        scrollBeyondLastLine: false,
        wordWrap: "on",
        lineNumbers: "on",
        renderLineHighlight: "all",
        cursorBlinking: "smooth",
        cursorSmoothCaretAnimation: "on",
        smoothScrolling: true,
        padding: { top: 16, bottom: 16 },
        tabSize: 2,
        automaticLayout: true,
        bracketPairColorization: { enabled: true },
        guides: { bracketPairs: true, indentation: true },
        suggest: { preview: true },
        acceptSuggestionOnEnter: "on",
      }}
    />
  );
}
