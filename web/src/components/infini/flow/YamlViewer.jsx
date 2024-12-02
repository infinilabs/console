import { Resizable } from "re-resizable";
import { ResizeBar } from "@/components/infini/resize_bar";
import { Editor } from "@/components/monaco-editor";
import { useState } from "react";

const YamlViewer = ({ value, onChange }) => {
  // const [editorHeight, setEditorHeight] = useState("30vh");
  // const onResize = (_env, _dir, refToElement, delta) => {
  //   setEditorHeight(refToElement.clientHeight);
  // };

  const onTextChange = (text) => {
    if (typeof onChange == "function") {
      onChange(text);
    }
  };

  return (
    <div className="yaml-viewer-cnt">
      {/* <Resizable
        defaultSize={{
          height: "30vh",
        }}
        minHeight={10}
        maxHeight="100vh"
        handleComponent={{ top: <ResizeBar /> }}
        onResize={onResize}
        enable={{
          top: true,
          right: false,
          bottom: false,
          left: false,
          topRight: false,
          bottomRight: false,
          bottomLeft: false,
          topLeft: false,
        }}
      > */}
      <div style={{ height: "100%" }}>
        <Editor
          height={450}
          language="yaml"
          theme="light"
          value={value}
          onChange={onTextChange}
          options={{
            minimap: {
              enabled: false,
            },
            tabSize: 2,
            // readOnly: true,
            wordBasedSuggestions: true,
          }}
          // onMount={(editor) =>
          // }
        />
      </div>
      {/* </Resizable> */}
    </div>
  );
};

export default YamlViewer;
