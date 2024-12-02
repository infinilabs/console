import { useEffect, useMemo, useState } from "react"
import Widget from "./Widget"
import styles from "./WidgetLoader.less"
import { Empty, Spin } from "antd"
import request from "@/utils/request"
import { generateFilter, mergeFilters } from "./components/QueriesBar/generate_filters"

export const WidgetRender = (props) => {

   const { widget, range, query, queryParams = {}, highlightRange = {} } = props;
   const [globalRangeCache, setGlobalRangeCache] = useState()

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

   return (
      widget ? (
         <Widget
            record={widget}
            globalQueries={{
               range,
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
         />
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