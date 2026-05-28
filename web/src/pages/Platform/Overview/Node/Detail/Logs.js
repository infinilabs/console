import {
  Button,
  Icon,
  InputNumber,
  Select,
  Tooltip,
  Slider,
  Popover,
  Switch,
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
import request from "@/utils/request";
import moment from "moment";
import { formatter } from "@/utils/format";

import InstallAgent from "@/components/InstallAgent";
import { formatMessage } from "umi/locale";
import Location from "@/components/Icons/Location";
const PAGE_SIZE = 50;
const DEFAULT_TAIL_LINES = 200;
const TAIL_LINE_OPTIONS = [50, 100, 200, 500, 1000];

const getLogFileKey = (logFile = {}) =>
  `${logFile.logs_path || ""}::${logFile.name || ""}`;

const getLatestStartLine = (totalRows = 0) =>
  Math.max((totalRows || 0) - PAGE_SIZE + 1, 1);

const hasKnownTotalRows = (logFile = {}) =>
  logFile?.total_rows_known === true && Number.isInteger(logFile?.total_rows);

const createInitialLogState = (viewerVersion = 0) => ({
  hasNextPage: true,
  isNextPageLoading: false,
  items: [],
  logFiles: [],
  file: "",
  fileName: "",
  logsPath: "",
  offset: 0,
  totalRows: undefined,
  totalRowsKnown: false,
  startLineNumber: 1,
  loadTailLines: 0,
  latestLines: DEFAULT_TAIL_LINES,
  followLatestEnabled: false,
  autoScrollToBottom: false,
  viewerVersion,
});

const getSelectedFileState = (
  logFile = {},
  { followLatestEnabled = false, autoScrollToBottom = false } = {}
) => {
  const totalRowsKnown = hasKnownTotalRows(logFile);
  return {
    file: logFile?.name ? getLogFileKey(logFile) : "",
    fileName: logFile?.name,
    logsPath: logFile?.logs_path,
    fileSize: logFile?.size_in_bytes,
    totalRows: totalRowsKnown ? logFile?.total_rows : undefined,
    totalRowsKnown,
    offset: 0,
    items: [],
    hasNextPage: !!logFile?.name,
    isNextPageLoading: false,
    startLineNumber: totalRowsKnown ? getLatestStartLine(logFile?.total_rows) : 1,
    loadTailLines: 0,
    followLatestEnabled,
    autoScrollToBottom,
  };
};

const formatLogFileLabel = (logFile = {}, includeMeta = false) => {
  const parts = [logFile.name];
  if (logFile.logs_path) {
    parts.push(logFile.logs_path);
  }
  if (includeMeta) {
    parts.push(formatter.bytes(logFile.size_in_bytes || 0));
    if (logFile.modify_time) {
      parts.push(moment(logFile.modify_time).format("YYYY.MM.DD"));
    }
  }
  return parts.filter(Boolean).join(" | ");
};

const Logs = (props) => {
  const clusterID = props.data?._source?.metadata?.cluster_id;
  const nodeID = props.data?._source?.metadata?.node_id;
  const [logState, setLogState] = useState(() => createInitialLogState());

  const [loading, setLoading] = useState(false);
  const [gotoLine, setGotoLine] = useState();
  const [gotoPopoverVisible, setGotoPopoverVisible] = useState(false);
  const logStateRef = useRef(logState);
  const requestSeqRef = useRef(0);

  useEffect(() => {
    logStateRef.current = logState;
  }, [logState]);

  const selectedLogFile = useMemo(
    () =>
      (logState.logFiles || []).find(
        (logFile) => getLogFileKey(logFile) === logState.file
      ),
    [logState.file, logState.logFiles]
  );

  const fetchLogs = async (withLoading = false, preferredFile = logStateRef.current.file) => {
    if (withLoading) setLoading(true);
    const res = await request(`/elasticsearch/${clusterID}/node/${nodeID}/logs/_list`);
    if (res && res.success) {
      const { log_files: logFiles } = res;
      const selectedFile =
        logFiles.find((logFile) => getLogFileKey(logFile) === preferredFile) ||
        logFiles[0] ||
        {};
      const currentState = logStateRef.current;
      const keepFollowLatest =
        preferredFile && preferredFile === currentState.file
          ? currentState.followLatestEnabled
          : false;
      requestSeqRef.current += 1;
      setLogState((st) => {
        return {
          ...st,
          agentStatus: undefined,
          logFiles,
          viewerVersion: st.viewerVersion + 1,
          ...getSelectedFileState(selectedFile, {
            followLatestEnabled: keepFollowLatest,
            autoScrollToBottom: keepFollowLatest,
          }),
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
    if (!nodeID) {
      return;
    }
    requestSeqRef.current += 1;
    setLogState((st) => createInitialLogState(st.viewerVersion + 1));
    fetchLogs();
  }, [clusterID, nodeID]);

  const loadNextPage = useCallback(
    async (...args) => {
      const force = args[0] === true;
      const currentState = logStateRef.current;
      if (!currentState.file) {
        return;
      }
      if (currentState.isNextPageLoading) {
        return;
      }
      if (!force && !currentState.hasNextPage) {
        return;
      }
      const requestSeq = requestSeqRef.current + 1;
      requestSeqRef.current = requestSeq;
      setLogState((st) => {
        return {
          ...st,
          isNextPageLoading: true,
        };
      });
      const res = await request(`/elasticsearch/${clusterID}/node/${nodeID}/logs/_read`, {
        method: "POST",
        body: {
          file_name: currentState.fileName,
          logs_path: currentState.logsPath,
          offset: currentState.offset,
          start_line_number: currentState.startLineNumber,
          tail_lines: currentState.loadTailLines,
          lines: PAGE_SIZE,
        },
      });
      if (requestSeq !== requestSeqRef.current) {
        return;
      }
      setLogState((st) => {
        if (st.file !== currentState.file) {
          return {
            ...st,
            isNextPageLoading: false,
          };
        }
        const incomingLines = (res?.lines || []).map((line, index, arr) => {
          if (
            currentState.loadTailLines > 0 &&
            st.totalRowsKnown &&
            Number.isInteger(st.totalRows)
          ) {
            return {
              ...line,
              line_number: Math.max(st.totalRows - arr.length + index + 1, 1),
            };
          }
          return line;
        });
        const newItems = [...st.items];
        let idx = newItems.length;
        incomingLines.forEach((line) => {
          newItems.push({
            ...line,
            lineNumber: line.line_number,
            index: idx,
          });
          idx += 1;
        });
        const lastLine = newItems[newItems.length - 1];
        const lastLineNumber = lastLine?.line_number;
        const nextStartLineNumber = Number.isInteger(lastLineNumber)
          ? lastLineNumber + 1
          : 0;
        return {
          ...st,
          hasNextPage: !!res?.has_more,
          isNextPageLoading: false,
          items: newItems,
          offset: lastLine?.offset || st.offset,
          startLineNumber:
            incomingLines.length > 0 ? nextStartLineNumber : st.startLineNumber,
          loadTailLines: 0,
          totalRows:
            st.totalRowsKnown &&
            Number.isInteger(lastLineNumber) &&
            lastLineNumber > (st.totalRows || 0)
              ? lastLineNumber
              : st.totalRows,
        };
      });
    },
    [clusterID, nodeID]
  );

  const clearAutoRefresh = () => {
    if (autoRefreshTimeoutRef.current) {
      setRefreshStart(false);
      clearTimeout(autoRefreshTimeoutRef.current);
      autoRefreshTimeoutRef.current = null;
      setLogState((st) => {
        return {
          ...st,
          autoScrollToBottom: false,
        };
      });
    }
  };

  const resetViewerPosition = useCallback(
    ({
      startLineNumber = 1,
      autoScrollToBottom = false,
      loadTailLines = 0,
      followLatestEnabled,
    }) => {
      requestSeqRef.current += 1;
      setLogState((st) => {
        return {
          ...st,
          viewerVersion: st.viewerVersion + 1,
          hasNextPage: !!st.fileName,
          isNextPageLoading: false,
          items: [],
          offset: 0,
          startLineNumber:
            loadTailLines > 0 ? 0 : Math.max(startLineNumber || 1, 1),
          loadTailLines,
          ...(typeof followLatestEnabled === "boolean"
            ? { followLatestEnabled }
            : {}),
          autoScrollToBottom,
        };
      });
    },
    []
  );

  const onLogFileChange = (file) => {
    clearAutoRefresh();
    requestSeqRef.current += 1;
    setLogState((st) => {
      const logFile = st.logFiles.find((lf) => getLogFileKey(lf) === file);
      return {
        ...st,
        viewerVersion: st.viewerVersion + 1,
        ...getSelectedFileState(logFile),
      };
    });
  };

  const onGotoOffsetClick = () => {
    clearAutoRefresh();
    if (!logStateRef.current.totalRowsKnown) {
      return false;
    }
    if (!Number.isInteger(gotoLine) || gotoLine < 1) {
      return false;
    }
    resetViewerPosition({
      startLineNumber: gotoLine,
      autoScrollToBottom: false,
      followLatestEnabled: false,
    });
    setGotoPopoverVisible(false);
    return true;
  };

  const autoRefreshTimeoutRef = useRef();
  const [refreshStart, setRefreshStart] = useState(false);

  const autoRefresh = async () => {
    setLogState((st) => {
      return {
        ...st,
        autoRefreshLoading: true,
        autoScrollToBottom: st.followLatestEnabled,
      };
    });
    await loadNextPage(true);
    setLogState((st) => {
      return {
        ...st,
        autoRefreshLoading: false,
      };
    });
    autoRefreshTimeoutRef.current = setTimeout(autoRefresh, 5000);
  };

  const refreshCurrentLog = useCallback(async () => {
    const currentState = logStateRef.current;
    if (!currentState.fileName) {
      await fetchLogs(true, currentState.file);
      return;
    }
    setLogState((st) => ({
      ...st,
      autoScrollToBottom: st.followLatestEnabled,
    }));
    await loadNextPage(true);
  }, [loadNextPage]);

  useEffect(() => {
    return clearAutoRefresh;
  }, []);

  const onViewLatestClick = (checked) => {
    if (!checked) {
      setLogState((st) => ({
        ...st,
        followLatestEnabled: false,
        autoScrollToBottom: false,
      }));
      return;
    }
    clearAutoRefresh();
    resetViewerPosition({
      loadTailLines: logStateRef.current.latestLines || DEFAULT_TAIL_LINES,
      autoScrollToBottom: true,
      followLatestEnabled: true,
    });
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
          <InstallAgent centerToggle={true} showAdvanced={false} />
        </div>
      </div>
    );
  }

  return (
    <div className="logs">
      <div className="form-line">
        <div className="form-item form-item--log-file">
          <span className="form-item__label">
            {formatMessage({ id: "agent.logs.label.log_file" })}
          </span>
          <div className="log-file-picker">
            <Tooltip title={selectedLogFile ? formatLogFileLabel(selectedLogFile, true) : ""}>
              <Select
                className="log-file-select"
                value={logState.file}
                onChange={onLogFileChange}
                optionLabelProp="label"
                showSearch
                optionFilterProp="title"
                dropdownMatchSelectWidth={false}
                dropdownClassName="log-file-select-dropdown"
                dropdownStyle={{ width: 520, maxWidth: "calc(100vw - 48px)" }}
              >
                {(logState.logFiles || []).map((logFile) => {
                  const optionKey = getLogFileKey(logFile);
                  const optionLabel = formatLogFileLabel(logFile);
                  return (
                    <Select.Option
                      key={optionKey}
                      value={optionKey}
                      label={logFile.name}
                      title={optionLabel}
                    >
                      <div className="log-file-option">
                        <span className="log-file-option__name" title={logFile.name}>
                          {logFile.name}
                        </span>
                        <span className="log-file-option__meta">
                          {formatter.bytes(logFile.size_in_bytes || 0)}
                        </span>
                      </div>
                    </Select.Option>
                  );
                })}
              </Select>
            </Tooltip>
            {selectedLogFile ? (
              <Tooltip title={formatLogFileLabel(selectedLogFile, true)}>
                <div className="log-file-summary">
                  {selectedLogFile.logs_path ? (
                    <span className="log-file-summary__path">
                      {selectedLogFile.logs_path}
                    </span>
                  ) : null}
                  <span className="log-file-summary__time">
                    {moment(selectedLogFile.modify_time).format("YYYY.MM.DD HH:mm")}
                  </span>
                </div>
              </Tooltip>
            ) : null}
          </div>
        </div>
        <div className="log-actions">
          <div className="log-latest-switch">
            <span className="log-latest-switch__label">
              {formatMessage({ id: "agent.logs.button.view_latest" })}
            </span>
            <Switch
              size="small"
              checked={logState.followLatestEnabled}
              onChange={onViewLatestClick}
            />
            <Select
              size="small"
              value={logState.latestLines}
              className="log-latest-switch__select"
              onChange={(value) => {
                clearAutoRefresh();
                setLogState((st) => ({
                  ...st,
                  latestLines: value,
                }));
                if (logStateRef.current.followLatestEnabled) {
                  resetViewerPosition({
                    loadTailLines: value,
                    autoScrollToBottom: true,
                    followLatestEnabled: true,
                  });
                }
              }}
            >
              {TAIL_LINE_OPTIONS.map((count) => (
                <Select.Option key={count} value={count}>
                  {count}
                </Select.Option>
              ))}
            </Select>
            <span className="log-latest-switch__suffix">
              {formatMessage({ id: "agent.logs.label.latest_lines" })}
            </span>
          </div>
          <Button
            type="primary"
            ghost
            onClick={() => {
              clearAutoRefresh();
              refreshCurrentLog();
            }}
          >
            {formatMessage({ id: "form.button.refresh" })}
          </Button>
          <Button
            type="primary"
            ghost
            icon={refreshStart ? "pause" : "caret-right"}
            onClick={() => {
              setRefreshStart(!refreshStart);
              if (autoRefreshTimeoutRef.current) {
                clearAutoRefresh();
                return;
              }
              autoRefresh();
            }}
          />
          {logState.totalRowsKnown ? (
            <Popover
              placement="topRight"
              visible={gotoPopoverVisible}
              onVisibleChange={setGotoPopoverVisible}
              content={
                <div style={{ display: "flex" }}>
                  <div className="form-item">
                    {formatMessage({ id: "agent.logs.label.goto" })}
                    <InputNumber
                      min={1}
                      precision={0}
                      style={{ width: 96, margin: "0 5px" }}
                      className="offset"
                      value={gotoLine}
                      onChange={setGotoLine}
                      onPressEnter={onGotoOffsetClick}
                    />
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
          ) : (
            <Button type="primary" ghost disabled>
              <Icon component={Location} />
            </Button>
          )}
        </div>
      </div>
        <div className="viewer">
          {logState.file ? (
            <InfiniteLogViewer
              key={`${logState.file}:${logState.viewerVersion}`}
              {...logState}
              loadNextPage={loadNextPage}
              resetViewerPosition={resetViewerPosition}
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
  autoScrollToBottom,
  totalRows,
  totalRowsKnown,
  resetViewerPosition,
}) => {
  const maxLineNumber = useMemo(
    () =>
      items.reduce((max, item) => {
        if (Number.isInteger(item.lineNumber) && item.lineNumber > max) {
          return item.lineNumber;
        }
        return max;
      }, totalRows || 1),
    [items, totalRows]
  );
  const fullScreenHandle = useFullScreenHandle();

  const itemCount = hasNextPage ? items.length + 1 : items.length;

  const loadMoreItems = isNextPageLoading ? () => Promise.resolve() : loadNextPage;
  const [progress, setProgress] = useState(0);

  const progressCacheRef = useRef();
  const sliderChangingRef = useRef(false);

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
    sliderChangingRef.current = true;
    progressCacheRef.current = v;
    setProgress(v);
  };

  const onSliderAfterChange = () => {
    if (
      totalRowsKnown &&
      Number.isInteger(progressCacheRef.current) &&
      totalRows > 0
    ) {
      const startLineNumber = Math.max(
        parseInt((totalRows * progressCacheRef.current) / 100, 10),
        1
      );
      resetViewerPosition({
        startLineNumber,
        autoScrollToBottom: false,
        followLatestEnabled: false,
      });
    }
    sliderChangingRef.current = false;
  };

  useEffect(() => {
    if (autoScrollToBottom === true) {
      listRef.current?.scrollToItem(Math.max(itemCount - 1, 0), "end");
    }
  }, [autoScrollToBottom, itemCount, items]);

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
                        if (
                          !sliderChangingRef.current &&
                          totalRowsKnown &&
                          totalRows > 0 &&
                          Number.isInteger(visibleStopIndex) &&
                          items[visibleStopIndex]
                        ) {
                          setProgress(
                            parseInt(
                              Math.floor(
                                (items[visibleStopIndex].lineNumber / totalRows) * 100
                              ).toFixed(0),
                              10
                            )
                          );
                        }
                        return onItemsRendered(props);
                      }}
                      ref={listRef}
                      height={height}
                      width={width}
                      itemSize={getRowHeight}
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
          <Slider
            disabled={!totalRowsKnown || totalRows <= 0}
            value={progress}
            onChange={onSliderChange}
            onAfterChange={onSliderAfterChange}
          />
        </div>
      </div>
    </FullScreen>
  );
};
