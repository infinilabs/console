import { useRef, useCallback, } from "react"
import _ from "lodash";
import {Editor} from "@/components/monaco-editor";
import {Icon} from "antd";

export const SettingsEditor = ({sourceText="",targetText="", onValueChange, optimize})=>{
  const sourceEditorRef = useRef()
  const targetEditorRef = useRef()
  const copySourceClick = useCallback(()=>{
    if(typeof optimize === "function"){
      let cfg = JSON.parse(sourceText)
      cfg = optimize(cfg)
      sourceText = JSON.stringify(cfg, "", 2)
    }
      targetEditorRef.current.setValue(sourceText);
  }, [sourceText, targetEditorRef])

  const onChange = useCallback( _.debounce((text)=>{
    if(typeof onValueChange === "function") {
      onValueChange(text)
    }
  }, 500),[onValueChange])
  return (<div style={{display:"flex", alignItems:"center"}}>
    <div style={{ width: "calc(50% - 25px)"}}>
    <Editor
        height="300px"
        language="json"
        theme="light"
        value={sourceText}
        options={{
          minimap: {
            enabled: false,
          },
          tabSize: 2,
          wordBasedSuggestions: true,
          scrollBeyondLastLine: false,
          readOnly: true,
        }}
        onMount={(editor) =>sourceEditorRef.current = editor}
      />
    </div>
    <div style={{width: 50, fontSize:24,color:"#1890ff", textAlign:"center", cursor: "pointer"}}>
      <Icon type="double-right" onClick={copySourceClick}/>
    </div>
    <div style={{width: "calc(50% - 25px)"}}>
    <Editor
        height="300px"
        language="json"
        theme="light"
        value={targetText}
        options={{
          minimap: {
            enabled: false,
          },
          tabSize: 2,
          wordBasedSuggestions: true,
          scrollBeyondLastLine: false,
        }}
        onMount={(editor) =>targetEditorRef.current = editor}
        onChange={onChange}
        onValidate={(errs)=>{
          if(errs && errs.length > 0){
            //todo error handling
          }
        }}
      />
    </div>
  </div>)
}