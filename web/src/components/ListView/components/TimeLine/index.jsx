import { Timeline, Card, Input, Dropdown, Select, Icon, Spin } from "antd";
import InfiniteScroll from "react-infinite-scroll-component";
import { useMemo, useState, useEffect } from "react";
// import styles from "./index.less";

export default (props) => {
  const {
    loading = false,
    data = [],
    total = 0,
    onNext,
    from = 0,
    itemRender = null,
  } = props;

  const [dataNew, setDataNew] = useState([]);

  useEffect(() => {
    if (from == 0) {
      setDataNew(data);
    } else {
      setDataNew(dataNew.concat(data));
    }
  }, [data]);

  const hasMore = total > dataNew.length;

  return (
    <div style={{ paddingTop: 20 }}>
      <Spin spinning={loading && dataNew.length == 0} tip="loading...">
        <InfiniteScroll
          dataLength={dataNew.length}
          next={() => {
            if (!loading && typeof onNext == "function") {
              onNext(dataNew.length);
            }
          }}
          hasMore={hasMore}
          loader={
            loading ? (
              <div style={{ textAlign: "center", margin: "10px auto", color: "#999" }}>
                Loading...
              </div>
            ) : null
          }
          endMessage={null}
        >
          <Timeline>
            {dataNew.map((item, i) => {
              return (
                <Timeline.Item key={item.id}>
                  {itemRender && itemRender(item)}
                </Timeline.Item>
              );
            })}
          </Timeline>
        </InfiniteScroll>
        {!loading && hasMore && dataNew.length > 0 && (
          <div
            style={{ textAlign: "center", margin: "10px auto", cursor: "pointer", color: "#1890ff" }}
            onClick={() => {
              if (typeof onNext == "function") {
                onNext(dataNew.length);
              }
            }}
          >
            Click to load more
          </div>
        )}
      </Spin>
    </div>
  );
};
