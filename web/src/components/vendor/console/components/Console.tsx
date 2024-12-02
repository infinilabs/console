// @ts-ignore
import React, {
  useRef,
  useMemo,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import ConsoleInput from "./ConsoleInput";
import ConsoleOutput from "./ConsoleOutput";
import { Panel } from "./Panel";
import PanelsContainer from "./PanelContainer";
import { PanelContextProvider } from "../contexts/panel_context";
import { PanelRegistry } from "../contexts/panel_context/registry";
import "./Console.scss";
import {
  RequestContextProvider,
  useRequestReadContext,
} from "../contexts/request_context";
import { EditorContextProvider } from "../contexts/editor_context/editor_context";
import { ServicesContextProvider } from "../contexts/services_context";
import {
  createHistory,
  History,
  createStorage,
  createSettings,
} from "../services";
import { create } from "../storage/local_storage_object_client";
import { EuiFlexGroup, EuiFlexItem, EuiCodeBlock } from "@elastic/eui";
import { RequestStatusBar } from "./request_status_bar";
import useEventListener from "@/lib/hooks/use_event_listener";
import { Tabs } from "antd";

interface props {
  selectedCluster: any;
  saveEditorContent: (content: string) => void;
  initialText: string;
  paneKey: string;
  height: number;
  isActive: boolean;
}

const INITIAL_PANEL_WIDTH = 50;
const PANEL_MIN_WIDTH = "0px";

const ConsoleWrapper = ({
  selectedCluster,
  saveEditorContent,
  initialText,
  paneKey,
  isActive,
  height,
}: props) => {
  const {
    requestInFlight: requestInProgress,
    lastResult: { data: requestData, error: requestError },
  } = useRequestReadContext();

  const lastDatum = requestData?.[requestData.length - 1] ?? requestError;

  const calcHeight = height > 0 ? height + "px" : "100%";
  // const leftBarRef = useRef(null)
  // const rightBarRef = useRef(null)
  // const [widths, setWidths] = useState(['calc(50% - 7px)', 'calc(50% - 7px)'])
  // const onPanelWidthChange = (widths:any)=>{
  //   const [lp, rp] = widths;
  //   setWidths([lp+'%', rp+'%']);
  // }

  return (
    <div style={{ height: calcHeight }}>
      <div className="Console" style={{ height: "100%" }}>
        <PanelsContainer resizerClassName="resizer">
          <Panel
            style={{
              height: "100%",
              position: "relative",
              minWidth: PANEL_MIN_WIDTH,
              paddingBottom: 26,
            }}
            initialWidth={INITIAL_PANEL_WIDTH}
          >
            <ConsoleInput
              height={height - 26 + "px"}
              selectedCluster={selectedCluster}
              saveEditorContent={saveEditorContent}
              initialText={initialText}
              paneKey={paneKey}
              isActive={isActive}
            />
            <div
              style={{
                background: "#fff",
                position: "absolute",
                left: 0,
                bottom: 0,
                width: "100%",
                height: 26,
                zIndex: 997,
                borderTop: "1px solid #eee",
              }}
            >
              <RequestStatusBar
                requestInProgress={requestInProgress}
                selectedCluster={selectedCluster}
                left={true}
                requestResult={
                  lastDatum && lastDatum.request
                    ? {
                        method: lastDatum.request.method.toUpperCase(),
                        endpoint: lastDatum.request.path,
                        statusCode: lastDatum.response?.statusCode,
                        statusText: lastDatum.response?.statusText,
                        timeElapsedMs: lastDatum.response?.timeMs,
                        requestHeader: lastDatum.request.header,
                        responseHeader: lastDatum.response?.header,
                      }
                    : undefined
                }
              />
            </div>
          </Panel>
          <Panel
            style={{
              height: "100%",
              position: "relative",
              minWidth: PANEL_MIN_WIDTH,
              paddingBottom: 26,
            }}
            initialWidth={INITIAL_PANEL_WIDTH}
          >
            <Tabs
              tabPosition="right"
              style={{ height: "100%", width: "100%" }}
              size="small"
            >
              <Tabs.TabPane tab="Result" key="result">
                <div style={{ height: height - 26 }}>
                  <ConsoleOutput clusterID={selectedCluster.id} />
                </div>
              </Tabs.TabPane>
              <Tabs.TabPane tab="Headers" key="headers">
                <Tabs animated={false}>
                  <Tabs.TabPane tab="Request" key="1">
                    <EuiCodeBlock language="text" isCopyable paddingSize="s">
                      {lastDatum?.request?.header}
                    </EuiCodeBlock>
                  </Tabs.TabPane>
                  <Tabs.TabPane tab="Response" key="2">
                    <EuiCodeBlock language="text" isCopyable paddingSize="s">
                      {lastDatum?.response?.header}
                    </EuiCodeBlock>
                  </Tabs.TabPane>
                </Tabs>
              </Tabs.TabPane>
            </Tabs>
            <div
              style={{
                background: "#fff",
                position: "absolute",
                right: 0,
                bottom: 0,
                width: "100%",
                height: 26,
                zIndex: 997,
                borderTop: "1px solid #eee",
              }}
            >
              <RequestStatusBar
                requestInProgress={requestInProgress}
                selectedCluster={selectedCluster}
                requestResult={
                  lastDatum && lastDatum.request
                    ? {
                        method: lastDatum.request.method.toUpperCase(),
                        endpoint: lastDatum.request.path,
                        statusCode: lastDatum.response?.statusCode,
                        statusText: lastDatum.response?.statusText,
                        timeElapsedMs: lastDatum.response?.timeMs,
                        requestHeader: lastDatum.request.header,
                        responseHeader: lastDatum.response?.header,
                      }
                    : undefined
                }
              />
            </div>
          </Panel>
        </PanelsContainer>
      </div>
      {/* <div ref={statusBarRef} style={{ position:'fixed', bottom:0, borderTop: '1px solid #eee', zIndex:1001, width:'100%'}}>
      <div style={{background:'#fff',height:30,  width:'100%'}}>
            <RequestStatusBar
              requestInProgress={requestInProgress}
              selectedCluster={selectedCluster}
              container={consoleRef}
              requestResult={
                lastDatum
                  ? {
                      method: lastDatum.request.method.toUpperCase(),
                      endpoint: lastDatum.request.path,
                      statusCode: lastDatum.response.statusCode,
                      statusText: lastDatum.response.statusText,
                    timeElapsedMs: lastDatum.response.timeMs,
                    requestHeader: lastDatum.request.header,
                    responseHeader: lastDatum.response.header,
                  }
                : undefined
            }
          />
        </div>
      </div> */}
    </div>
  );
};

const Console = (params: props) => {
  const registryRef = useRef(new PanelRegistry());
  // const [consoleInputKey]  = useMemo(()=>{
  //   return [selectedCluster.id + '-console-input'];
  // },[selectedCluster])

  const { storage, history, objectStorageClient, settings } = useMemo(() => {
    const storage = createStorage({
      engine: window.localStorage,
      prefix: "sense:",
    });
    const history: History = createHistory({ storage });
    const objectStorageClient = create(storage);
    const settings = createSettings({ storage });
    return { storage, history, objectStorageClient, settings };
  }, []);
  return (
    <PanelContextProvider registry={registryRef.current}>
      <RequestContextProvider>
        <EditorContextProvider>
          <ServicesContextProvider
            value={{
              services: { history, storage, objectStorageClient, settings },
              clusterID: params.selectedCluster.id,
            }}
          >
            <ConsoleWrapper {...params} />
          </ServicesContextProvider>
        </EditorContextProvider>
      </RequestContextProvider>
    </PanelContextProvider>
  );
};
export default Console;
