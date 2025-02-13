import { useEffect, useMemo, useState } from "react"
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

   const { widget, range, query, queryParams = {}, highlightRange = {}, refresh, showCopy = true } = props;
   const [globalRangeCache, setGlobalRangeCache] = useState()
   const [requests, setRequests] = useState([])

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

   const formatTimeRange = useMemo(() => {
      if (!range.from || !range.to) return { from: 'now-15m', to: 'now'}
      const bounds = calculateBounds(range);
      return {
         from: moment(bounds.min.valueOf()).tz(getTimezone()).utc().format(),
         to: moment(bounds.max.valueOf()).tz(getTimezone()).utc().format(),
      };
   }, [JSON.stringify(range), refresh]);

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
               record={widget}
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
               globalRangeCache={globalRangeCache}
               onGlobalRangeCacheChange={setGlobalRangeCache}
               onGlobalQueriesChange={() => {}}
               onClone={() => {}}
               onRemove={() => {}}
               onSave={() => {}}
               onFullElement={() => {}}
               clusterList={[]}
               highlightRange={highlightRange}
               onHighlightRangeChange={() => {}}
               onResultChange={(res) => {
                  setRequests(Array.isArray(res) ? res.filter((item) => !!item.request).map((item) => item.request) : [])
               }}
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