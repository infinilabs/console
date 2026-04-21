import { Button, Divider, Drawer, Icon, Input, Select, Tooltip } from "antd";
import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { VariableSizeList as List } from "react-window";
import InfiniteLoader from "react-window-infinite-loader";
import AutoSizer from "react-virtualized-auto-sizer";
import {
  FullScreen,
  useFullScreenHandle,
} from "@/components/hooks/useFullScreen";

import './index.scss';
import useFetch from "@/lib/hooks/use_fetch";
import request from "@/utils/request";

export default ({ text, record }) => {

    const [visible, setVisible] = useState(false);

    const [logState, setLogState] = useState({
        hasNextPage: true,
        isNextPageLoading: false,
        items: [],
        offset: 0,
    });

    const loadNextPage = useCallback(
        async (...args) => {
          setLogState((st) => {
            return {
              ...st,
              isNextPageLoading: true,
            };
          });
          const res = await request(`/migration/migration/123/log`, {
            method: "GET",
          });
          if (res && res.lines) {
            setLogState((st) => {
              const newItems = [...logState.items];
              let idx = newItems.length;
              res.lines.map((line) => {
                newItems.push({
                  ...line,
                  lineNumber: line.line_number,
                  index: idx,
                });
                idx++;
              });
              return {
                ...st,
                hasNextPage: res.has_more,
                isNextPageLoading: false,
                items: newItems,
                offset: newItems[newItems.length - 1]?.offset || st.offset,
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
        [logState]
      );

    return (
        <>
            <a onClick={() => setVisible(true)}>{text}</a>
            <Drawer
                title={"Logs"}
                width={640}
                placement="right"
                onClose={() => setVisible(false)}
                visible={visible}
                destroyOnClose
            >
              <InfiniteLogViewer
                    {...logState}
                    loadNextPage={loadNextPage}
                />
            </Drawer>
        </>
    )
}

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
      if (maxLineNumber < 1000) return '2em';
      return `${Math.floor(Math.log10(maxLineNumber))}em`
    }, [maxLineNumber])
  
    return (
      <div className="log-row" ref={rowRef}>
        <span className="number" style={{width: numberWidth}}>{Number.isInteger(lineNumber) ? lineNumber : 'N/A'}</span>
        <div>
          <Tooltip getPopupContainer={() => rowRef.current} placement="right" title={`offset: ${offset}`}>
            <Icon type="unordered-list" />
          </Tooltip>
        </div>
        <div className={"log-text"} style={{ width: `calc(100% - ${numberWidth} - 2em - 12px)`}}>
          {
            (
              !isFullScreen && <div
                className="more"
                onClick={() => {
                  setCollapsed(!innerCollapsed);
                }}
              >
                <Icon type={innerCollapsed ? "right" : "down"} />
              </div>
            )
          }
          <p className={innerCollapsed && !isFullScreen ? "text collapsed" : "text"}>
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
  }) => {
    const maxLineNumber = Math.max(...items.filter((item) => Number.isInteger(item.lineNumber)).map((item) => item.lineNumber))
    const fullScreenHandle = useFullScreenHandle();
  
    const itemCount = hasNextPage ? items.length + 1 : items.length;
  
    const loadMoreItems = isNextPageLoading ? () => {} : loadNextPage;
  
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
  
    return (
      <FullScreen handle={fullScreenHandle}>
        <div className={"log-viewer"}>
          <div className="v-header">
            <div className="icon-list">
              <div className="icon">
                {
                  fullScreenHandle.active ? (
                    <Icon type="fullscreen-exit" onClick={fullScreenHandle.exit} />
                  ) : (
                    <Icon type="fullscreen" onClick={fullScreenHandle.enter} />
                  )
                }
              </div>
            </div>
          </div>
            <div className="body" style={{ height: fullScreenHandle.active ? 'calc(100vh - 40px)' : 'calc(100vh - 126px)'}}>
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
                            return onItemsRendered(props)
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
        </div>
      </FullScreen>
    );
  };