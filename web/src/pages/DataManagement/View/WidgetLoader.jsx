import { useEffect, useMemo, useRef, useState } from "react"
import Widget from "./Widget"
import styles from "./WidgetLoader.less"
import { Empty, Icon, message, Spin, Tooltip } from "antd"
import request from "@/utils/request"
import { generateFilter, mergeFilters } from "./components/QueriesBar/generate_filters"
import { calculateBounds } from "@/components/vendor/data/common/query/timefilter";
import moment from "moment"
import { getTimezone } from "@/utils/utils"
import { CopyToClipboard } from "react-copy-to-clipboard";
import { formatMessage } from "umi/locale";

export const WidgetRender = (props) => {
 
   const {
      widget,
      range,
      query,
      queryParams = {},
      highlightRange = {},
      refresh,
      showCopy = true,
      onGlobalQueriesChange = () => {},
      onHighlightRangeChange = () => {},
   } = props;
   const [globalRangeCache, setGlobalRangeCache] = useState()
   const [requests, setRequests] = useState([])
   const fallbackWidgetIdRef = useRef(`widget-${Math.random().toString(36).slice(2)}`)

   const filters = useMemo(() => {
      const newFilters = []
      const keys = Object.keys(queryParams);
      keys.forEach((key) => {
         if (queryParams[key]) {
            newFilters.push(generateFilter(
               [],
               key,
               queryParams[key],
               '+',
               undefined
            ))
         }
      })
      return mergeFilters([], newFilters)
   }, [JSON.stringify(queryParams)])

   const normalizeRangeValue = (value, fallback) => {
      if (typeof value === "string" || typeof value === "number") {
         return `${value}`;
      }
      if (value && typeof value === "object") {
         for (const key of ["from", "to", "min", "max", "gte", "lte", "start", "end"]) {
            if (
              Object.prototype.hasOwnProperty.call(value, key) &&
              value[key] !== undefined &&
              value[key] !== null
            ) {
              return `${value[key]}`;
            }
         }
      }
      return fallback;
   };

   const formatTimeRange = useMemo(() => {
      const from = normalizeRangeValue(range?.from, "now-15m");
      const to = normalizeRangeValue(range?.to, "now");
      if (from === "auto" || to === "auto") {
         return { from: "auto", to: "auto" };
      }
      if (!from || !to) {
         return { from: "now-15m", to: "now" };
      }
      try {
         const bounds = calculateBounds({ from, to });
         return {
            from: moment(bounds.min.valueOf()).tz(getTimezone()).utc().format(),
            to: moment(bounds.max.valueOf()).tz(getTimezone()).utc().format(),
         };
      } catch (e) {
         return { from: "now-15m", to: "now" };
      }
   }, [JSON.stringify(range), refresh]);

   const renderWidget = useMemo(() => {
      if (!widget) {
         return widget;
      }
      if (widget.id) {
         return widget;
      }
      return {
         ...widget,
         id: fallbackWidgetIdRef.current,
      };
   }, [widget]);

   return (
      widget ? (
         <div className={styles.content}>
            {
               showCopy && requests.length > 0 && (
                  <CopyToClipboard text={requests.join('\n')}>
                     <Tooltip placement="left" title={formatMessage({id: "cluster.metrics.request.copy"})}>
                        <div className={styles.copy} onClick={() => message.success(formatMessage({id: "cluster.metrics.request.copy.success"}))}>
                           <Icon type="copy" />
                        </div>
                     </Tooltip>
                  </CopyToClipboard>
               )
            }
            <Widget
              record={renderWidget}
               globalQueries={{
                  range: formatTimeRange,
                  filters,
                  query
               }}
               isEdit={false}
               isFullElement={false}
               isFullScreen={true}
               hideHeader={true}
               displayOptions={{
                  hideHeader: true,
                  hideBorder: true,
               }}
               lockInteractions={false}
               autoApplyRangeFilter={true}
                globalRangeCache={globalRangeCache}
                onGlobalRangeCacheChange={setGlobalRangeCache}
                onGlobalQueriesChange={onGlobalQueriesChange}
                onClone={() => {}}
                onRemove={() => {}}
                onSave={() => {}}
                onFullElement={() => {}}
                clusterList={[]}
                highlightRange={highlightRange}
                onHighlightRangeChange={onHighlightRangeChange}
                onResultChange={(res) => {
                   setRequests(Array.isArray(res) ? res.filter((item) => !!item.request).map((item) => item.request) : [])
                }}
                refresh={refresh}
            />
         </div>
      ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
   )
}

export default (props) => {

    const { id } = props
    
    const [loading, setLoading] = useState(false);
    const [widget, setWidget] = useState();

    const fetchWidget = async (id) => {
        setLoading(true)
        const res = await request(`/insight/widget/${id}`)
        if (res?.found) {
            const newWidget = res._source || {};
            const { config = {} } = newWidget;
            setWidget({
                ...newWidget,
                ...config
            })
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchWidget(id)
    }, [id])

    return (
      <div className={styles.widget}>
         <Spin spinning={loading}>
            <WidgetRender widget={widget} {...props}/>
         </Spin>
      </div>
    )
}
