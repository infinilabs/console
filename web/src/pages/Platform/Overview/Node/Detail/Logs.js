import {
  Button,
  Divider,
  Icon,
  Input,
  Progress,
  Select,
  Tooltip,
  Slider,
  Popover,
} from "antd";
import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { VariableSizeList as List } from "react-window";
import InfiniteLoader from "react-window-infinite-loader";
import AutoSizer from "react-virtualized-auto-sizer";
import {
  FullScreen,
  useFullScreenHandle,
} from "@/components/hooks/useFullScreen";

import "./logs.scss";
import useFetch from "@/lib/hooks/use_fetch";
import request from "@/utils/request";
import moment from "moment";
import { formatter } from "@/utils/format";

import InstallAgent from "@/components/InstallAgent";
import { formatMessage } from "umi/locale";
import Location from "@/components/Icons/Location";
const ButtonGroup = Button.Group;

const Logs = (props) => {
  const clusterID = props.data?._source?.metadata?.cluster_id;
  const nodeID = props.data?._source?.metadata?.node_id;
  const [logState, setLogState] = useState({
    hasNextPage: true,
    isNextPageLoading: false,
    items: [],
    logFiles: [],
    file: "",
    offset: 0,
    startLineNumber: 1,
    autoScrollToBottom: false,
  });

  const [loading, setLoading] = useState(false);

  const fetchLogs = async (withLoading) => {
    if (withLoading) setLoading(true);
    const res = await request(`/elasticsearch/${clusterID}/node/${nodeID}/logs/_list`);
    if (res && res.success) {
      const { log_files: logFiles } = res;
      setLogState((st) => {
        return {
          ...st,
          logFiles,
          file: logFiles[0]?.name,
          fileSize: logFiles[0]?.size_in_bytes,
          totalRows: logFiles[0]?.total_rows,
          startLineNumber: 1,
        };
      });
    } else {
      if (res && !res.success && res.reason === "AGENT_NOT_FOUND") {
        setLogState((st) => {
          return {
            ...st,
            agentStatus: "uninstall",
          };
        });
      }
    }
    if (withLoading) setLoading(false);
  };

  useEffect(() => {
    if(!nodeID){
      return
    }
    setLogState({
      hasNextPage: true,
      isNextPageLoading: false,
      items: [],
      logFiles: [],
      file: "",
      offset: 0,
      startLineNumber: 1,
    });
    fetchLogs();
  }, [nodeID]);
  const loadNextPage = useCallback(
    async (...args) => {
      if (!logState.file) {
        return;
      }
      // console.log("loadNextPage", ...args);
      let newLogState = logState;
      setLogState((st) => {
        newLogState = st;
        return {
          ...st,
          isNextPageLoading: true,
        };
      });
      const res = await request(`/elasticsearch/${clusterID}/node/${nodeID}/logs/_read`, {
        method: "POST",
        body: {
          file_name: newLogState.file,
          offset: newLogState.offset,
          start_line_number: newLogState.startLineNumber,
          lines: 50,
        },
      });
      if (res && res.lines) {
        setLogState((st) => {
          const newItems = [...newLogState.items];
          let idx = newItems.length;
          res.lines.map((line) => {
            newItems.push({
              ...line,
              lineNumber: line.line_number,
              index: idx,
            });
            idx++;
          });
          const maxLineNumber = newItems[newItems.length - 1]?.line_number;
          return {
            ...st,
            hasNextPage: res.has_more,
            isNextPageLoading: false,
            items: newItems,
            offset: newItems[newItems.length - 1]?.offset || st.offset,
            startLineNumber: maxLineNumber + 1,
            totalRows: maxLineNumber > st.totalRows ? maxLineNumber :  st.totalRows,
          };
        });
      } else {
        setLogState((st) => {
          return {
            ...st,
            isNextPageLoading: false,
            hasNextPage: res.has_more,
          };
        });
      }
    },
    [nodeID, logState]
  );
  const clearAutoRefresh = ()=>{
    if(autoRefreshTimeoutRef.current){
      setRefreshStart(false);
      clearTimeout(autoRefreshTimeoutRef.current);
      autoRefreshTimeoutRef.current = null;
      setLogState(st=>{
        return {
          ...st,
          autoScrollToBottom: false,
        }
      })
    }
  }
  const onLogFileChange = (file) => {
    clearAutoRefresh();
    setLogState((st) => {
      const logFile = st.logFiles.find((lf) => lf.name == file);
      return {
        ...st,
        file,
        offset: 0,
        items: [],
        hasNextPage: true,
        fileSize: logFile?.size_in_bytes,
        totalRows: logFile?.total_rows,
        startLineNumber: 1,
      };
    });
  };
  const offsetRef = useRef();
  const onGotoOffsetClick = () => {
    clearAutoRefresh();
    setLogState((st) => {
      return {
        ...st,
        currentLineNumber: parseInt(offsetRef.current?.state.value)
      };
    });
  };

  const autoRefreshTimeoutRef = useRef();
  const [refreshStart, setRefreshStart] = useState(false);
  const autoRefresh = async ()=> {
    setLogState(st=>{
      return {
        ...st,
        autoRefreshLoading: true,
        autoScrollToBottom: true,
        currentLineNumber: undefined
      }
    })
    await loadNextPage()
    setLogState(st=>{
      return {
        ...st,
        autoRefreshLoading: false,
      }
    })
    autoRefreshTimeoutRef.current = setTimeout(autoRefresh, 5000)
  }

  useEffect(()=>{
    return clearAutoRefresh;
  }, []);

  const onViewLatestClick = () => {
    setLogState((st) => {
      return {
        ...st,
        startLineNumber: st.totalRows - 20,
        items: [],
        hasNextPage: true,
      };
    });
    // autoRefreshTimeoutRef.current = setTimeout(autoRefresh, 5000)
   
  };

  if (logState.agentStatus === "uninstall") {
    return (
      <div className="install-agent">
        <div className="tips">
          <div className="left">
            <svg className="icon" viewBox="0 0 32 32" width="24" height="24">
              <defs data-reactroot=""></defs>
              <g>
                <path d="M12 2.667v2.667h-5.333l-0.001 13.333h18.667l0.001-13.333h-5.333v-2.667h6.667c0.736 0 1.333 0.597 1.333 1.333v0 24c0 0.736-0.597 1.333-1.333 1.333v0h-21.333c-0.736 0-1.333-0.597-1.333-1.333v0-24c0-0.736 0.597-1.333 1.333-1.333v0h6.667zM25.332 21.333h-18.667l0.001 5.333h18.667l-0.001-5.333zM22.667 22.667v2.667h-2.667v-2.667h2.667zM17.333 2.667v6.667h4l-5.333 5.333-5.333-5.333h4v-6.667h2.667z"></path>
              </g>
            </svg>
            <span className="text">
            {formatMessage({ id: "agent.install.logs.tips" })}
            </span>
          </div>
          <div className="right">
            <Button
              loading={loading}
              size="small"
              onClick={() => fetchLogs(true)}
            >
              {formatMessage({ id: "form.button.refresh" })}
            </Button>
          </div>
        </div>
        <div className="content">
          <div className="title">
          {formatMessage({ id: "agent.install.title" })}
          </div>
          <InstallAgent />
        </div>
      </div>
    );
  }

  return (
    <div className="logs">
      <div className="form-line">
        <div className="form-item">
        {formatMessage({ id: "agent.logs.label.log_file" })}
          <Select
            style={{ width: 390 }}
            value={logState.file}
            onChange={onLogFileChange}
            dropdownMatchSelectWidth={false}
          >
            {(logState.logFiles || []).map((logFile) => {
              return (
                <Select.Option key={logFile.name} value={logFile.name}>
                  {logFile.name}
                  <Divider type="vertical" />
                  {formatter.bytes(logFile.size_in_bytes || 0)}
                  <Divider type="vertical" />
                  {moment(logFile.modify_time).format("YYYY.MM.DD")}
                </Select.Option>
              );
            })}
          </Select>
        </div>
        <ButtonGroup>
        {/* loading={logState.autoRefreshLoading} */}
          <Button type="primary" ghost onClick={onViewLatestClick}> {formatMessage({ id: "agent.logs.button.view_latest" })}</Button>
          <Button type="primary" ghost 
          icon={refreshStart ? "pause" : "caret-right"}
          onClick={()=>{
            setRefreshStart(!refreshStart);
            if(autoRefreshTimeoutRef.current){
              clearAutoRefresh();
              return
            }
            autoRefresh();
          }}
        />
          <Popover
            placement="topRight"
            content={
              <div style={{display:"flex"}}>
                <div className="form-item">
                {formatMessage({ id: "agent.logs.label.goto" })}
                  <Input key="offset" style={{width: 80, margin:"0 5px"}} className="offset" ref={offsetRef} />
                </div>
                <Button type="primary" onClick={onGotoOffsetClick}>
                {formatMessage({ id: "agent.logs.button.goto" })}
                </Button>
              </div>
            }
            trigger="click"
          >
            <Button type="primary" ghost>
              <Icon component={Location} />
            </Button>
          </Popover>
        </ButtonGroup>
      </div>
      <div className="viewer">
        {logState.file ? (
          <InfiniteLogViewer
            key={logState.file}
            {...logState}
            setLogState={setLogState}
            loadNextPage={loadNextPage}
            autoScrollToBottom={logState.autoScrollToBottom}
          />
        ) : null}
      </div>
    </div>
  );
};

export default Logs;

const LogRow = ({
  lineNumber,
  offset,
  content,
  setRowHeight,
  collapsed = true,
  index,
  isFullScreen = false,
  maxLineNumber,
}) => {
  const [innerCollapsed, setCollapsed] = useState(collapsed);
  const rowRef = useRef();
  useEffect(() => {
    if (rowRef.current) {
      setRowHeight(index, {
        size: rowRef.current.clientHeight,
        collapsed: innerCollapsed,
      });
    }
  }, [innerCollapsed, rowRef.current]);

  const numberWidth = useMemo(() => {
    if (maxLineNumber < 1000) return "2em";
    return `${Math.floor(Math.log10(maxLineNumber))}em`;
  }, [maxLineNumber]);

  return (
    <div className="log-row" ref={rowRef}>
      <span className="number" style={{ width: numberWidth }}>
        {Number.isInteger(lineNumber) ? lineNumber : "N/A"}
      </span>
      <div>
        <Tooltip
          getPopupContainer={() => rowRef.current}
          placement="right"
          title={`offset: ${offset}`}
        >
          <Icon type="unordered-list" />
        </Tooltip>
      </div>
      <div
        className={"log-text"}
        style={{ width: `calc(100% - ${numberWidth} - 2em - 12px)` }}
      >
        {!isFullScreen && (
          <div
            className="more"
            onClick={() => {
              setCollapsed(!innerCollapsed);
            }}
          >
            <Icon type={innerCollapsed ? "right" : "down"} />
          </div>
        )}
        <p
          className={
            innerCollapsed && !isFullScreen ? "text collapsed" : "text"
          }
        >
          {content}
        </p>
      </div>
    </div>
  );
};

const InfiniteLogViewer = ({
  hasNextPage,
  isNextPageLoading,
  items,
  loadNextPage,
  file,
  logFiles,
  setLogState,
  autoScrollToBottom,
  currentLineNumber,
  totalRows,
}) => {
  const maxLineNumber = Math.max(
    ...items
      .filter((item) => Number.isInteger(item.lineNumber))
      .map((item) => item.lineNumber)
  );
  const fullScreenHandle = useFullScreenHandle();

  const itemCount = hasNextPage ? items.length + 1 : items.length;

  const loadMoreItems = isNextPageLoading ? () => {} : loadNextPage;
  const [progress, setProgress] = useState(0);

  const progressCacheRef = useRef()

  // Every row is loaded except for our loading indicator row.
  const isItemLoaded = (index) => !hasNextPage || index < items.length;

  const listRef = useRef(null);
  const rowHeights = useRef({});

  function getRowHeight(index) {
    return rowHeights.current[index] || 20;
  }
  function setRowHeight(index, { size, collapsed }) {
    items[index].collapsed = collapsed;
    listRef?.current?.resetAfterIndex(0);
    rowHeights.current = { ...rowHeights.current, [index]: size };
  }

  // Render an item or a loading indicator.
  const Item = ({ index, style }) => {
    const rowRef = useRef({});
    let content;
    if (!isItemLoaded(index)) {
      content = <div ref={rowRef}>Loading...</div>;
    } else {
      content = (
        <LogRow
          rowRef={rowRef}
          {...items[index]}
          style={style}
          setRowHeight={setRowHeight}
          isFullScreen={fullScreenHandle.active}
          maxLineNumber={maxLineNumber}
        />
      );
    }

    return <div style={style}>{content}</div>;
  };
  const onSliderChange = (v) => {
    progressCacheRef.current = v;
    setProgress(v);
  };

  const onSliderAfterChange = () => {
    if (Number.isInteger(progressCacheRef.current)) {
      setLogState((st) => {
        let startLineNumber = parseInt((st.totalRows * progressCacheRef.current) / 100);
        return {
          ...st,
          hasNextPage: true,
          currentLineNumber: startLineNumber === 0 ? 1 : startLineNumber
        };
      });
    }
  }

  useEffect(() => {
    if (autoScrollToBottom === true) {
      listRef.current.scrollToItem(itemCount, "end");
    }
  }, [items]);

  useEffect(() => {
    if (autoScrollToBottom || items.length === 0 || !Number.isInteger(currentLineNumber) || currentLineNumber < 1) {
      return;
    }
    const lastItemLineNumber = items[items.length - 1].lineNumber
    if (lastItemLineNumber >= currentLineNumber) {
      listRef.current.scrollToItem(currentLineNumber - 1, "end");
    } else {
      if (hasNextPage) {
        loadNextPage()
      } else {
        listRef.current.scrollToItem(currentLineNumber - 1, "end");
      }
    }
  }, [JSON.stringify(items), hasNextPage, currentLineNumber, autoScrollToBottom])

  return (
    <FullScreen handle={fullScreenHandle}>
      <div className={"log-viewer"}>
        <div className="v-header">
          <div className="icon-list">
            <div className="icon">
              {fullScreenHandle.active ? (
                <Icon type="fullscreen-exit" onClick={fullScreenHandle.exit} />
              ) : (
                <Icon type="fullscreen" onClick={fullScreenHandle.enter} />
              )}
            </div>
          </div>
        </div>
        <div
          className="body"
          style={{
            height: fullScreenHandle.active
              ? "calc(100vh - 40px)"
              : "calc(100vh - 185px)",
          }}
        >
          <InfiniteLoader
            isItemLoaded={isItemLoaded}
            itemCount={itemCount}
            loadMoreItems={loadMoreItems}
          >
            {({ onItemsRendered, ref }) => (
              <AutoSizer>
                {({ height, width, ...otherProps }) => {
                  ref = listRef;
                  return (
                    <List
                      itemCount={itemCount}
                      onItemsRendered={(props) => {
                        const { visibleStopIndex } = props;
                        if (visibleStopIndex > 0) {
                          if (logFiles?.length === 0 || !file) return 0;
                          const currentFile = logFiles.find(
                            (item) => item.name === file
                          );
                          if (
                            currentFile &&
                            currentFile.size_in_bytes &&
                            Number.isInteger(visibleStopIndex) &&
                            items[visibleStopIndex]
                          ) {
                            setProgress(
                              parseInt(
                                Math.floor(
                                  (items[visibleStopIndex].lineNumber / totalRows) *
                                    100
                                ).toFixed(0)
                              )
                            );
                          }
                        }
                        return onItemsRendered(props);
                      }}
                      ref={listRef}
                      height={height}
                      width={width}
                      itemSize={getRowHeight}
                      onScroll={() => {
                        setLogState((logState) => ({
                          ...logState,
                          currentLineNumber: undefined
                        }))
                      }}
                    >
                      {Item}
                    </List>
                  );
                }}
              </AutoSizer>
            )}
          </InfiniteLoader>
        </div>
        <div style={{ marginTop: -4 }}>
          {/* <Progress percent={progress} size={"small"} status={"normal"}/> */}
          <Slider value={progress} onChange={onSliderChange} onAfterChange={onSliderAfterChange} />
        </div>
      </div>
    </FullScreen>
  );
};
