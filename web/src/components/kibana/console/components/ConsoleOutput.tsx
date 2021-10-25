// @ts-ignore
import React, { useRef, useEffect } from 'react';
import 'brace/mode/text';
import 'brace/mode/json';
import 'brace/mode/yaml';
import { CustomAceEditor, createReadOnlyAceEditor } from '../modules/legacy_core_editor/create_readonly';
import { useRequestReadContext } from '../contexts/request_context';
import './ConsoleInput.scss';

import {applyCurrentSettings} from './apply_editor_settings';
import { subscribeResizeChecker } from './subscribe_console_resize_checker';

const isJSONContentType = (contentType?: string) =>
  Boolean(contentType && contentType.indexOf('application/json') >= 0);

function modeForContentType(contentType?: string) {
  if (!contentType) {
    return 'ace/mode/text';
  }
  if (isJSONContentType(contentType)) {
    return 'ace/mode/json';
  } else if (contentType.indexOf('application/yaml') >= 0) {
    return 'ace/mode/yaml';
  }
  return 'ace/mode/text';
}

interface props {
  clusterID: string;
}

function ConsoleOutput({clusterID}: props) {
  const editorRef = useRef<null | HTMLDivElement>(null);
  const editorInstanceRef = useRef<null | CustomAceEditor>(null);
  const inputId = 'ConAppOutputTextarea';
  const {
    lastResult: { data, error },
  } = useRequestReadContext();
  
  useEffect(()=>{
    editorInstanceRef.current?.setValue('');
  },[clusterID])

  useEffect(() => {
    editorInstanceRef.current = createReadOnlyAceEditor(editorRef.current!);
    const textarea = editorRef.current!.querySelector('textarea')!;
    textarea.setAttribute('id', inputId);
    textarea.setAttribute('readonly', 'true');
    applyCurrentSettings(editorInstanceRef.current!, {fontSize:12, wrapMode: true,})
    const unsubscribeResizer = subscribeResizeChecker(editorRef.current!, editorInstanceRef.current!);

    return () => {
      unsubscribeResizer();
      editorInstanceRef.current!.destroy();
    };
  }, []);

  useEffect(() => {
    const editor = editorInstanceRef.current!;
    if (data) {
      //const mode = modeForContentType(data[0].response.contentType);
      editor.update(
        data
          .map((result) => {
            const { value, contentType } = result.response;
            if (isJSONContentType(contentType)) {
              let comment = '';
              let strValue = value as string;
              if(strValue[0]=='#'){
                const idx = strValue.indexOf('\n');
                comment = strValue.slice(0, idx);
                strValue = strValue.slice(idx)
                return comment + '\n' + JSON.stringify(JSON.parse(strValue), null, 2);
              }
              return JSON.stringify(JSON.parse(strValue), null, 2);
              
            }
            return value;
          })
          .join('\n'),
        // mode
      );
  
    } else if (error) {
      const mode = modeForContentType(error.response.contentType);
      if(mode == 'ace/mode/json'){
        editor.update(JSON.stringify(JSON.parse(error.response.value), null, 2), mode);
        return
      }
      editor.update(error.response.value as string, mode);
    } else {
      editor.update('');
    }
  }, [data, error]);

  return (
    <div ref={editorRef} className="conApp__outputContent" data-test-subj="response-editor">
      <div id="ConAppOutput" />
    </div>
  );
}

export default ConsoleOutput;
