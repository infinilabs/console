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

  return (
    <div style={{ paddingTop: 20 }}>
      <Spin spinning={loading && dataNew.length == 0} tip="loading...">
        <InfiniteScroll
          dataLength={dataNew.length}
          next={() => {
            if (typeof onNext == "function") {
              onNext(dataNew.length);
            }
          }}
          hasMore={!loading && total > dataNew.length}
          loader={
            <h4 style={{ textAlign: "center", margin: "10px auto" }}>
              Loading...
            </h4>
          }
          endMessage={null}
          scrollableTarget={document.getElementById('root')}
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
      </Spin>
    </div>
  );
};
