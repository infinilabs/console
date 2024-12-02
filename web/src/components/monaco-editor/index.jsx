import { loader } from "@monaco-editor/react";

loader.config({ paths: { vs: "/static/monaco-editor/min/vs" } });

export {default as Editor} from "@monaco-editor/react"; 