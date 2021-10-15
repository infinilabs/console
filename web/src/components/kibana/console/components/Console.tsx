// @ts-ignore
import React, { useRef, useMemo,useEffect } from 'react';
import ConsoleInput from './ConsoleInput';
import ConsoleOutput from './ConsoleOutput';
import { Panel } from './Panel';
import PanelsContainer from './PanelContainer';
import { PanelContextProvider } from '../contexts/panel_context';
import { PanelRegistry } from '../contexts/panel_context/registry';
import './Console.scss';
import { RequestContextProvider, useRequestReadContext } from '../contexts/request_context';
import {EditorContextProvider} from '../contexts/editor_context/editor_context';
import { ServicesContextProvider } from '../contexts/services_context';
import { createHistory, History, createStorage, createSettings } from '../services';
import { create } from '../storage/local_storage_object_client';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import {RequestStatusBar} from './request_status_bar';

interface props {
  selectedCluster: any;
  saveEditorContent: (content: string)=>void;
  initialText: string;
  paneKey: string;
}

const INITIAL_PANEL_WIDTH = 50;
const PANEL_MIN_WIDTH = '300px';

const ConsoleWrapper = ({
  selectedCluster,
  saveEditorContent,
  initialText,
  paneKey,
}:props) => {

  const {
    requestInFlight: requestInProgress,
    lastResult: { data: requestData, error: requestError },
  } = useRequestReadContext();

  const lastDatum = requestData?.[requestData.length - 1] ?? requestError;
  const getElementTop = (elem: any)=>{
    　　var elemTop=elem.offsetTop;
    　　elem=elem.offsetParent;
    
    　　while(elem!=null){ 
    　　　　elemTop+=elem.offsetTop;
    　　　　elem=elem.offsetParent;     
    　　}
    
    　　return elemTop;
    
    }
    const statusBarRef = useRef<HTMLDivElement>(null);
    const consoleRef = useRef<HTMLDivElement>(null);

    useEffect(()=>{
      statusBarRef.current && consoleRef.current && (statusBarRef.current.style.width=consoleRef.current.offsetWidth+'px');
      const winScroll = ()=>{
        const wsTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
        if(wsTop>getElementTop(consoleRef.current)) {
          statusBarRef.current && (statusBarRef.current.style.position='relative');
        }else{
          statusBarRef.current && (statusBarRef.current.style.position='fixed');
        }
      }
      window.addEventListener('scroll', winScroll)
      return ()=>{
        window.removeEventListener('scroll', winScroll)
      }
    },[])


  return ( 
    <div>
    <div ref={consoleRef} className="Console">
      <PanelsContainer resizerClassName="resizer">
        <Panel style={{ height: '100%', position: 'relative', minWidth: PANEL_MIN_WIDTH }} initialWidth={INITIAL_PANEL_WIDTH}>
          <ConsoleInput clusterID={selectedCluster.id} saveEditorContent={saveEditorContent} initialText={initialText} paneKey={paneKey} />
        </Panel>
        <Panel style={{ height: '100%', position: 'relative', minWidth: PANEL_MIN_WIDTH }} initialWidth={INITIAL_PANEL_WIDTH}>
          <ConsoleOutput clusterID={selectedCluster.id} /> 
        </Panel>
      </PanelsContainer>
    </div>
    <div ref={statusBarRef} style={{ position:'fixed', bottom:0, borderTop: '1px solid #eee', zIndex:5000}}>
      <EuiFlexGroup className="consoleContainer"
          style={{height:30, background:'#fff'}}
            gutterSize="none"
            direction="column">
            <EuiFlexItem className="conApp__tabsExtension">
            <RequestStatusBar
              requestInProgress={requestInProgress}
              selectedCluster={selectedCluster}
              requestResult={
                lastDatum
                  ? {
                      method: lastDatum.request.method.toUpperCase(),
                      endpoint: lastDatum.request.path,
                      statusCode: lastDatum.response.statusCode,
                      statusText: lastDatum.response.statusText,
                    timeElapsedMs: lastDatum.response.timeMs,
                  }
                : undefined
            }
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      </div>
  </div>          
  );
};

const Console = (params:props) => {
  const registryRef = useRef(new PanelRegistry());
  // const [consoleInputKey]  = useMemo(()=>{
  //   return [selectedCluster.id + '-console-input'];
  // },[selectedCluster])

  const {storage, history, objectStorageClient, settings} = useMemo(()=>{
    const storage = createStorage({
      engine: window.localStorage,
      prefix: 'sense:',
    });
    const history: History = createHistory({ storage });
    const objectStorageClient = create(storage);
    const settings = createSettings({storage});
    return {storage, history, objectStorageClient, settings};
  }, [])
  return ( <PanelContextProvider registry={registryRef.current}>
    <RequestContextProvider>
      <EditorContextProvider>
          <ServicesContextProvider value={{ services: { history, storage, objectStorageClient, settings}, clusterID: params.selectedCluster.id }}>
            <ConsoleWrapper {...params} />
          </ServicesContextProvider>
          </EditorContextProvider>
      </RequestContextProvider>
    </PanelContextProvider>
    );

}
export default Console;

