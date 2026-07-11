import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
} from "react";
import {
  Button,
  Empty,
  Input,
  Icon,
  Select,
  Switch,
  Tooltip,
  message,
} from "antd";
import { CopyToClipboard } from "react-copy-to-clipboard";
import useWebSocket, { ReadyState } from "react-use-websocket";
import request from "@/utils/request";
import { formatMessage } from "umi/locale";
import "./viewer.less";

const normalizeWebsocketEndpoint = (endpoint = "") => {
  const value = `${endpoint || ""}`.trim();
  if (!value) {
    return "";
  }
  if (value.startsWith("https://")) {
    return `wss://${value.slice("https://".length)}`;
  }
  if (value.startsWith("http://")) {
    return `ws://${value.slice("http://".length)}`;
  }
  return value;
};

const getRealtimeLogEndpoint = (instance = {}) => {
  const services = Array.isArray(instance.services) ? instance.services : [];
  const webService = services.find((service = {}) => {
    return (
      `${service.name || ""}`.trim().toLowerCase() === "web" &&
      `${service.endpoint || ""}`.trim() !== ""
    );
  });
  return normalizeWebsocketEndpoint(instance.endpoint || webService?.endpoint || "");
};

const WebsocketLogViewer = ({ instance = {} }) => {
  const endpoint = getRealtimeLogEndpoint(instance);
  if (endpoint === "") {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={formatMessage({
          id: "gateway.instance.logging.endpoint.empty",
        })}
      />
    );
  }
  let url;
  try {
    url = new URL(endpoint);
  } catch (err) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={formatMessage({
          id: "gateway.instance.logging.endpoint.empty",
        })}
      />
    );
  }
  const wsSchema =
    location.protocol.replace(":", "") === "https" ? "wss" : "ws";
  const socketUrl = `${wsSchema}://${location.host}/ws_proxy?instance_id=${encodeURIComponent(
    instance.id
  )}&endpoint=${encodeURIComponent(endpoint)}&path=${encodeURIComponent("/ws")}`;
  const [pubMessages, setPubMessages] = useState([]);
  const [loggingConfig, setLoggingConfig] = useState({});
  const messageEnd = useRef();
  const logPanelRef = useRef();
  const didUnmount = useRef(false);

  const { readyState } = useWebSocket(socketUrl, {
    shouldReconnect: () => {
      return didUnmount.current === false;
    },
    reconnectAttempts: 30,
    reconnectInterval: 10000,
    onMessage: (ev) => {
      const rawMsg = typeof ev.data === "string" ? ev.data : "";
      if (!rawMsg) {
        return;
      }
      const [msgType] = rawMsg.split(" ", 1);
      const msg = rawMsg.substr(msgType.length + 1);
      if (msgType !== "PUBLIC") {
        if (msgType == "CONFIG") {
          const trimmedMsg = msg.trim();
          if (!trimmedMsg || !/^[\[{]/.test(trimmedMsg)) {
            return;
          }
          let configObj = {};
          try {
            configObj = JSON.parse(trimmedMsg);
          } catch (err) {
            return;
          }
          setLoggingConfig(configObj);
        }
        return;
      }

      setPubMessages((msgs) => {
        let newMsgs = msgs.concat(msg);
        if (newMsgs.length > 10000) {
          newMsgs = newMsgs.slice(newMsgs.length - 10000);
        }
        return newMsgs;
      });
    },
  });
  useEffect(() => {
    return () => {
      didUnmount.current = true;
    };
  }, []);

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
      const panel = logPanelRef.current;
      if (panel) {
        panel.scrollTop = panel.scrollHeight;
      } else {
        messageEnd.current?.scrollIntoView({ block: "end" });
      }
    }
  }, [pubMessages.length]);

  const connectionMeta = useMemo(
    () => ({
      [ReadyState.CONNECTING]: {
        icon: "sync",
        className: "realtime-log-viewer__status realtime-log-viewer__status--connecting",
        text: formatMessage({ id: "gateway.instance.logging.connection.connecting" }),
      },
      [ReadyState.OPEN]: {
        icon: "check-circle",
        theme: "filled",
        className: "realtime-log-viewer__status realtime-log-viewer__status--open",
        text: formatMessage({ id: "gateway.instance.logging.connection.established" }),
      },
      [ReadyState.CLOSING]: {
        icon: "disconnect",
        className: "realtime-log-viewer__status realtime-log-viewer__status--closing",
        text: formatMessage({ id: "gateway.instance.logging.connection.closing" }),
      },
      [ReadyState.CLOSED]: {
        icon: "close-circle",
        theme: "filled",
        className: "realtime-log-viewer__status realtime-log-viewer__status--closed",
        text: formatMessage({ id: "gateway.instance.logging.connection.closed" }),
      },
      [ReadyState.UNINSTANTIATED]: {
        icon: "pause-circle",
        className: "realtime-log-viewer__status realtime-log-viewer__status--idle",
        text: formatMessage({ id: "gateway.instance.logging.connection.uninstantiated" }),
      },
    }),
    []
  );
  const copyText = useMemo(() => pubMessages.join("\n"), [pubMessages]);

  return (
    <div className="realtime-log-viewer">
      <div className="realtime-log-viewer__header">
        <div className="realtime-log-viewer__toolbar">
          <Select
            className="realtime-log-viewer__level"
            onChange={(v) => {
              setLoggingConfig((st) => {
                return {
                  ...st,
                  push_log_level: v,
                };
              });
            }}
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
            className="realtime-log-viewer__input"
            key="filePattern"
            placeholder={formatMessage({
              id: "gateway.instance.logging.placeholder.file_pattern",
            })}
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
            className="realtime-log-viewer__input"
            key="funcPattern"
            placeholder={formatMessage({
              id: "gateway.instance.logging.placeholder.func_pattern",
            })}
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
            className="realtime-log-viewer__input realtime-log-viewer__input--wide"
            key="msgPattern"
            placeholder={formatMessage({
              id: "gateway.instance.logging.placeholder.message_pattern",
            })}
          />
          <Button
            icon="play-circle"
            disabled={loggingConfig.realtime}
            type="primary"
            onClick={onStartClick}
          >
            {formatMessage({ id: "gateway.instance.logging.button.start" })}
          </Button>
          <Button
            icon="stop"
            onClick={onStopClick}
            disabled={!loggingConfig.realtime}
          >
            {formatMessage({ id: "gateway.instance.logging.button.stop" })}
          </Button>
        </div>
        <div className="realtime-log-viewer__meta">
          <div className="realtime-log-viewer__meta-item realtime-log-viewer__meta-item--switch">
            <Icon type="vertical-align-bottom" />
            <span className="realtime-log-viewer__meta-label">
              {formatMessage({ id: "gateway.instance.logging.auto_scroll" })}
            </span>
            <Switch onChange={setAutoScrollToBottom} checked={autoScrollToBottom} />
          </div>
          <ConnectionStatus readyState={readyState} connectionMeta={connectionMeta} />
          <div className="realtime-log-viewer__meta-item realtime-log-viewer__meta-item--endpoint">
            <Icon type="link" />
            <span className="realtime-log-viewer__meta-label">
              {formatMessage({ id: "gateway.instance.logging.endpoint.label" })}
            </span>
            <span className="realtime-log-viewer__meta-value" title={url.host}>
              {url.host}
            </span>
          </div>
        </div>
      </div>
      <div className="realtime-log-viewer__body">
        <div className="realtime-log-viewer__log-panel" ref={logPanelRef}>
          <div className="realtime-log-viewer__floating-actions">
            <Tooltip
              title={formatMessage({ id: "gateway.instance.logging.copy" })}
            >
              <CopyToClipboard
                text={copyText}
                onCopy={() => {
                  message.success(
                    formatMessage({
                      id: "gateway.instance.logging.copy.success",
                    })
                  );
                }}
              >
                <Button
                  className="realtime-log-viewer__copy-button"
                  icon="copy"
                  shape="circle"
                  size="small"
                  disabled={pubMessages.length === 0}
                />
              </CopyToClipboard>
            </Tooltip>
          </div>
          {!loggingConfig.realtime && pubMessages.length === 0 ? (
            <div className="realtime-log-viewer__empty">
              <Icon type="play-circle" theme="filled" />
              <span>
                {formatMessage({ id: "gateway.instance.logging.empty" })}
              </span>
            </div>
          ) : (
            <div className="realtime-log-viewer__log-list">
            {pubMessages.map((message, idx) => (
              <div key={idx} className="realtime-log-viewer__log-line">
                {message}
              </div>
            ))}
            </div>
          )}
          <div style={{ float: "left", clear: "both" }} ref={messageEnd} />
        </div>
      </div>
    </div>
  );
};

export default WebsocketLogViewer;

const ConnectionStatus = ({ readyState, connectionMeta = {} }) => {
  const status =
    connectionMeta[readyState] || connectionMeta[ReadyState.UNINSTANTIATED];
  return (
    <div className={status.className} aria-label={status.text}>
      <Icon type={status.icon} theme={status.theme} />
      <span>{status.text}</span>
    </div>
  );
};
