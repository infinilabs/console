// @ts-ignore
import React, { useRef, useEffect, CSSProperties, useMemo } from 'react';
import ace from 'brace';
import { EuiFlexGroup, EuiFlexItem, EuiIcon, EuiToolTip } from '@elastic/eui';
import { SenseEditor } from '../entities/sense_editor';
import { LegacyCoreEditor } from '../modules/legacy_core_editor/legacy_core_editor';
import ConsoleMenu from './ConsoleMenu';
// import { RequestContextProvider } from '../contexts/request_context';
import { getDocumentation, autoIndent } from '../entities/console_menu_actions';
import './ConsoleInput.scss';
import { useSendCurrentRequestToES } from '../hooks/use_send_current_request_to_es';
import { useSetInputEditor } from '../hooks/use_set_input_editor';
import '@elastic/eui/dist/eui_theme_light.css';
import { instance as registry } from '../contexts/editor_context/editor_registry';
import 'antd/dist/antd.css';
import {retrieveAutoCompleteInfo} from '../modules/mappings/mappings';
import {useSaveCurrentTextObject} from '../hooks/use_save_current_text_object';
import {useEditorReadContext} from '../contexts/editor_context/editor_context';
import {useDataInit} from '../hooks/use_data_init';
import { useServicesContext } from '../contexts';
import {applyCurrentSettings} from './apply_editor_settings';
import { subscribeResizeChecker } from './subscribe_console_resize_checker';

const abs: CSSProperties = {
  position: 'absolute',
  top: '0',
  left: '0',
  bottom: '0',
  right: '0',
};

// interface IConsoleInputProps {
//   onExecuteCommand?: () => void;
//   onQueryHistoryCommands: () => void;
//   onLoadCommonCommands: () => void;
//   onPatchCommonCommand: (id: string, params: ICommonCommandParams) => void;
//   onDeleteCommonCommand: (id: string) => void;
// }

const SendRequestButton = (props: any) => {
  const sendCurrentRequestToES = useSendCurrentRequestToES();
  const saveCurrentTextObject = useSaveCurrentTextObject();

  const {saveCurrentTextObjectRef} = props;
  useEffect(()=>{
    saveCurrentTextObjectRef.current = saveCurrentTextObject
  }, [saveCurrentTextObjectRef])
  

  return (
    <EuiToolTip
      content={'点击发送请求'}
    >
      <button
        data-test-subj="sendRequestButton"
        aria-label={'Click to send request'}
        className="conApp__editorActionButton conApp__editorActionButton--success"
        onClick={sendCurrentRequestToES}
      >
        <EuiIcon type="play" />
      </button>
    </EuiToolTip>
  );
};

interface ConsoleInputProps {
  clusterID: string,
  initialText: string | undefined,
}

const DEFAULT_INPUT_VALUE = `GET _search
{
  "query": {
    "match_all": {}
  }
}`;

const ConsoleInputUI = ({clusterID, initialText}:ConsoleInputProps) => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const editorActionsRef = useRef<HTMLDivElement | null>(null);
  const editorInstanceRef = useRef<SenseEditor | null>(null);
  
  const setInputEditor = useSetInputEditor();
  const consoleMenuRef = useRef<ConsoleMenu | null>(null);
  const aceEditorRef = useRef<ace.Editor | null>(null);

  const sendCurrentRequestToESRef = useRef(()=>{});
  const saveCurrentTextObjectRef = useRef((content:string)=>{});
  sendCurrentRequestToESRef.current = useSendCurrentRequestToES();
  
  const {services:{settings}} = useServicesContext();

  useEffect(() => {
    const aceEditor = ace.edit(editorRef.current!);
    aceEditorRef.current = aceEditor;
    const legacyCoreEditor = new LegacyCoreEditor(aceEditor, editorActionsRef.current as HTMLElement);
    aceEditor.commands.addCommand({
      name: 'exec_request',
      bindKey: {win: "Ctrl-enter", mac: "Command-enter|Ctrl-enter"},
      exec: ()=>{
        sendCurrentRequestToESRef.current();
      }
    })
    const senseEditor = new SenseEditor(legacyCoreEditor);
    // senseEditor.highlightCurrentRequestsAndUpdateActionBar();
    editorInstanceRef.current = senseEditor;
    setInputEditor(senseEditor);
    senseEditor.update(initialText || DEFAULT_INPUT_VALUE);
    // applyCurrentSettings(senseEditor!.getCoreEditor(), {fontSize:14, wrapMode: true,});

    function setupAutosave() {
      let timer: number;
      const saveDelay = 500;
    
      senseEditor.getCoreEditor().on('change', () => {
        if (timer) {
          clearTimeout(timer);
        }
        timer = window.setTimeout(saveCurrentState, saveDelay);
      });
    }

    function saveCurrentState() {
      try {
        const content = senseEditor.getCoreEditor().getValue();
        saveCurrentTextObjectRef.current(content);
      } catch (e) {
        console.log(e)
        // Ignoring saving error
      }
    }

    const unsubscribeResizer = subscribeResizeChecker(editorRef.current!, senseEditor);
    setupAutosave();

    return () => {
      unsubscribeResizer();
      if (editorInstanceRef.current) {
        editorInstanceRef.current.getCoreEditor().destroy();
      }
    }
  }, []);
  useEffect(()=>{
    retrieveAutoCompleteInfo(settings, settings.getAutocomplete(), clusterID);
  },[clusterID])

  const handleSaveAsCommonCommand = async () => {
    const editor = registry.getInputEditor();
    const requests = await editor.getRequestsInRange();
    const formattedRequest = requests.map(request => ({
      method: request.method,
      path: request.url,
      body: (request.data || []).join('\n'),
    }));
    return formattedRequest;
  };

  return (
      
        <div style={abs} data-test-subj="console-application" className="conApp">
          <div className="conApp__editor">
            <ul className="conApp__autoComplete" id="autocomplete" />
            <EuiFlexGroup
              className="conApp__editorActions"
              id="ConAppEditorActions"
              gutterSize="none"
              responsive={false}
              ref={editorActionsRef}
            >
              <EuiFlexItem>
                <SendRequestButton saveCurrentTextObjectRef={saveCurrentTextObjectRef}/>
              </EuiFlexItem>
              <EuiFlexItem>
                <ConsoleMenu
                  getCurl={() => {
                    return editorInstanceRef.current!.getRequestsAsCURL('');
                  }}
                  getDocumentation={() => {
                    return getDocumentation(editorInstanceRef.current!, '');
                  }}
                  autoIndent={(event) => {
                    autoIndent(editorInstanceRef.current!, event);
                  }}
                  saveAsCommonCommand={handleSaveAsCommonCommand}
                  ref={consoleMenuRef}
                />
              </EuiFlexItem>
            </EuiFlexGroup>
            <div
              ref={editorRef}
              id="ConAppEditor"
              className="conApp__editorContent"
              data-test-subj="request-editor"
              onClick={()=>{consoleMenuRef.current?.closePopover(); aceEditorRef.current?.focus()}}
            />
          </div>
        </div>
  );
};

const ConsoleInput = ({clusterID}:{clusterID:string})=>{
  const { done, error, retry } = useDataInit();
  const { currentTextObject } = useEditorReadContext();
  return done ? <ConsoleInputUI clusterID={clusterID} initialText={currentTextObject?.text}/>: <></>
}

export default ConsoleInput;



