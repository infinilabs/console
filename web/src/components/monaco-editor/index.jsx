import Editor, { loader, monaco } from "@monaco-editor/react";

loader.config({ paths: { vs: "/static/monaco-editor/min/vs" } });

export { Editor, monaco };
export default Editor;
