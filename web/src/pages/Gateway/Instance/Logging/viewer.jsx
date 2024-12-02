import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import {
  Button,
  Card,
  Input,
  Icon,
  Tabs,
  Select,
  Switch,
} from "antd";
import useWebSocket, { ReadyState } from "react-use-websocket";
import request from "@/utils/request";

const WebsocketLogViewer = ({instance={}}) => {
  let {endpoint = ""} = instance;
  if(endpoint === ""){
    console.error("empty endpoint");
    return;
  }
  const wsSchema = location.protocol.replace(":", "") === "https" ? "wss": "ws";
  const url = new URL(endpoint);
  if(url.protocol === "https:"){
    endpoint = endpoint.replace("https://", "wss://")
  }else{
    endpoint = endpoint.replace("http://", "ws://")
  }
  const [socketUrl, setSocketUrl] = useState(`${wsSchema}://${location.host}/ws_proxy?endpoint=${endpoint}&path=/ws`); //(`ws://${url.host}/ws`);
  const [pubMessages, setPubMessages] = useState([]);
  const [loggingConfig, setLoggingConfig] = useState({});
  const messageEnd = useRef();
  const didUnmount = useRef(false);

  const { sendMessage, lastMessage, readyState, getWebSocket } = useWebSocket(socketUrl, {
    shouldReconnect: (closeEvent) => {
      return didUnmount.current === false;
    },
    reconnectAttempts: 30,
    reconnectInterval: 10000,
    onMessage: (ev) => {
      const rawMsg = ev.data;
      const [msgType] = rawMsg.split(" ", 1);
      const msg = rawMsg.substr(msgType.length + 1);
      if (msgType !== "PUBLIC") {
        if (msgType == "CONFIG") {
          let configObj = {};
          try {
            configObj = JSON.parse(msg);
          } catch (err) {
            console.error(err);
          }
          setLoggingConfig(configObj);
        }
        return;
      }

      setPubMessages((msgs) => {
        let newMsgs = msgs.concat(msg);
        if(newMsgs.length > 10000) {
          newMsgs = newMsgs.slice(newMsgs.length - 10000)
        }
        return newMsgs
      });
    },
    onOpen: (ev) => {
      console.log("connected");
    },
  });
  useEffect(() => {
    return () => {
      didUnmount.current = true;
    };
  }, []);

  const connectionStatus = {
    [ReadyState.CONNECTING]: "Connecting",
    [ReadyState.OPEN]: "Established",
    [ReadyState.CLOSING]: "Closing",
    [ReadyState.CLOSED]: "Closed",
    [ReadyState.UNINSTANTIATED]: "Uninstantiated",
  }[readyState];

  const updateRealtimeConfig = async (realtime) => {
    const newLoggingConfig = {
      ...loggingConfig,
      realtime,
    };
    //todo cors
    await request(`/instance/${instance.id}/_proxy?method=POST&path=/setting/logger`, {
      method: "POST",
      body: newLoggingConfig,
    });
    setLoggingConfig(newLoggingConfig);
  };

  const onStartClick = () => {
    updateRealtimeConfig(true);
  };
  const onStopClick = () => {
    updateRealtimeConfig(false);
  };
  const onInputChange = (field, value) => {
    setLoggingConfig((st) => {
      return {
        ...st,
        [field]: value,
      };
    });
  };
  const [autoScrollToBottom, setAutoScrollToBottom] = useState(true);
  useEffect(() => {
    if (autoScrollToBottom === true) {
      messageEnd.current?.scrollIntoView();
    }
  }, [pubMessages.length]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center" }}>
        <div className="toolbar">
          <Select
            onChange={(v) => {
              setLoggingConfig((st) => {
                return {
                  ...st,
                  push_log_level: v,
                };
              });
            }}
            style={{ width: 100, marginRight: 5 }}
            value={loggingConfig?.push_log_level?.toUpperCase() || ""}
          >
            {["TRACE", "DEBUG", "INFO", "WARN", "ERROR", "CRITICAL"].map(
              (level) => {
                return (
                  <Select.Option key={level} value={level.toLowerCase()}>
                    {level}
                  </Select.Option>
                );
              }
            )}
          </Select>
          <Input
            value={
              loggingConfig.file_pattern === "*"
                ? ""
                : loggingConfig.file_pattern
            }
            onChange={(ev) => {
              const value = ev.target.value;
              onInputChange("file_pattern", value);
            }}
            style={{ width: 180, marginRight: 5 }}
            key="filePattern"
            placeholder="FilePattern, eg: xyz*.go"
          />
          <Input
            value={
              loggingConfig.func_pattern === "*"
                ? ""
                : loggingConfig.func_pattern
            }
            onChange={(ev) => {
              const value = ev.target.value;
              onInputChange("func_pattern", value);
            }}
            style={{ width: 185, marginRight: 5 }}
            key="funcPattern"
            placeholder="FuncPattern, eg: submit*"
          />
          <Input
            value={
              loggingConfig.message_pattern === "*"
                ? ""
                : loggingConfig.message_pattern
            }
            onChange={(ev) => {
              onInputChange("message_pattern", ev.target.value);
            }}
            style={{ width: 220, marginRight: 5 }}
            key="msgPattern"
            placeholder="MessagePattern, eg: *timeout"
          />
          <Button
            icon="play-circle"
            style={{ marginRight: 5 }}
            disabled={loggingConfig.realtime}
            type="primary"
            onClick={onStartClick}
          >
            Start
          </Button>
          <Button
            icon="stop"
            onClick={onStopClick}
            disabled={!loggingConfig.realtime}
          >
            Stop
          </Button>
        </div>
        <div style={{flex: "1 1 auto", textAlign:'center'}}><Switch onChange={setAutoScrollToBottom} checked={autoScrollToBottom}/> Auto Scroll </div>
        <div style={{ marginLeft: "auto" }}>
          <ConnectionStatus status={connectionStatus}/>
        </div>
      </div>
      <div style={{ marginTop: 10 }}>
        <div
          style={{
            background: "black",
            color:"#fff",
            padding: 5,
            fontSize: 14,
            maxHeight: "calc(100vh - 245px)",
            overflowY: "scroll",
          }}
        >
          {!loggingConfig.realtime && pubMessages.length === 0 ? <div> Click start button to show real-time logs </div>:
          <ul>
            {pubMessages.map((message, idx) => (
              <li key={idx}>{message}</li>
            ))}
          </ul>}
          <div style={{ float: "left", clear: "both" }} ref={messageEnd} />
        </div>
      </div>
    </div>
  );
};

export default WebsocketLogViewer;

const ConnectionStatus = ({status})=>{
  if(status === "Established"){
    return  <span style={{color:"green"}}>{status}</span>;
  }
  return status;
}