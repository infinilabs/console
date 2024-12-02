import styles from "./layout.less";

import { FullScreen, FullScreenHandle } from "@/components/hooks/useFullScreen";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Spin } from "antd";

import LayoutGrid from "./LayoutGrid";

export default forwardRef((props, ref) => {

  const { clusterId, indexPattern, timeRange, query, layout, fullScreenHandle} = props;

  const [loading, setLoading] = useState(false);

  const [record, setRecord] = useState();

  const [refresh, setRefresh] = useState();

  useImperativeHandle(ref, () => ({
    onRefresh: () => setRefresh(new Date().getTime())
  }));

  const style = fullScreenHandle?.active ? {
    padding: '6px',
    overflowY: 'auto',
    overflowX: 'hidden',
    backgroundcolor: '#fff',
    height: '100vh'
  } : {}

  const formatQuery = useMemo(() => {
    if (!query) return;
    const newQuery = { ... query }
    if (newQuery?.bool?.filter.length > 0) {
      const newFilter = newQuery.bool.filter;
      const lastFilter = newFilter[newFilter.length - 1];
      if (lastFilter.range) {
        newFilter.splice(newFilter.length - 1, 1);
        newQuery.bool.filter = newFilter;
      }
    }
    return JSON.stringify(newQuery)
  }, [JSON.stringify(query)])

  return (
    <FullScreen handle={fullScreenHandle}>
        <div className={styles.grid} style={style}>
          <Spin spinning={loading}>
            <div style={{ width: '100%' }} key={layout?.id}>
                <LayoutGrid 
                  gridStyle={{ padding: '0'}}
                  fullElementHeight={fullScreenHandle?.active ? 'calc(100vh - 12px)' : 'calc(100vh - 208px)'}
                  defaultLocked={true}
                  isEdit={false}
                  layout={layout}
                  type={"view"}
                  globalQueries={{
                      cluster_id: clusterId, 
                      indices: indexPattern?.title ? [indexPattern?.title] : '',
                      time_field: indexPattern?.timeFieldName,
                      query: formatQuery,
                      range: timeRange || {
                        from: 'now-15m',
                        to: 'now',
                      }
                  }}
                  onRecordUpdate={() => {}}
                  refresh={refresh}
              />  
            </div>
          </Spin>
        </div>
    </FullScreen>
  );
});
