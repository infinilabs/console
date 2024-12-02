import { formatESSearchResult } from "@/lib/elasticsearch/util";
import { WIDGETS } from "../widgets"
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import request from '@/utils/request';
import { getContext } from "../../../context";
import moment from 'moment';
import { Empty, Spin } from 'antd';
import { ESPrefix } from '@/services/common';
import { autoFormatUnitForBytes, formatNumberData, formatPercentData } from '../widgets/utils';
import { getWidgetData } from '@/pages/DataManagement/Insight/services/elasticsearch';
import { calculateBounds } from '@/components/vendor/data/common/query/timefilter/get_time';
import { getForceNow } from '@/components/vendor/data/public/query/timefilter/lib/get_force_now';
import { cloneDeep, groupBy, has } from "lodash";
import { buildQueryFromKuery } from "@/components/vendor/data/common/es_query/es_query/from_kuery";
import { buildQueryFromFilters } from "@/components/vendor/data/common";
import { generateFilter } from "../../components/QueriesBar/generate_filters";
import { dslToQueryFilters, filtersToQueryFilters, kqlFiltersToKql, kqlToQueryFilters } from "../../utils/utils";
import Chart403 from "./Chart403";

const {
    filterManager,
    queryStringManager,
    timefilter,
    storage,
    getEsQuery,
    getSearchParams,
    intervalOptions,
    getTimeBuckets,
    fetchESRequest,
    services,
    http,
} = getContext();

const formatters = {
  'number': formatNumberData,
  'bytes': autoFormatUnitForBytes,
  'percent': formatPercentData
}

export default (props) => {

    const { 
      record, 
      onRecordChange,
      loading, 
      setLoading, 
      globalQueries, 
      refresh, 
      globalRangeCache, 
      zoom, 
      zoomCache, 
      onZoomCacheUpdate,
      highlightRange,
      isEdit,
      fetchParamsCache,
      handleContextMenu,
      isFullScreen
    } = props;

    const { series = [] } = record;
    const { queries = {} } = series[0] || {}
  
    const [data, setData] = useState()

    const [currentParams, setCurrentParams] = useState();

    const chartRef = useRef(null)

    const isLockRef = useRef(isEdit || isFullScreen)

    const fetchData = async (params, zoom, refresh) => {
      if (['iframe'].includes(type) || !params || !params.currentQueries) return;
      const {
        currentQueries, 
        isTimeSeries,
        bucket_size,
        order, 
        size,
        page_size,
        metrics,
        type,
        orders = [],
        queryFrom,
        timeFieldOrder,
        is_layered,
        layer_index = 0,
        group_labels = [],
      } = params;
      const { 
        cluster_id, indices = [], time_field, range, 
        globalDsl, globalKqlFilters=[], globalKql, globalFilters =[],
        customDsl, customKqlFilters = [], 
        bucketSizeCache 
      } = currentQueries;
      if (!cluster_id || indices.length === 0) {
        return;
      }

      if (!refresh) {
        setLoading(true)
        setData()
      }

      if (isTimeSeries && !range) {
        return;
      }
      let newRange;
      let rangeFilter;
      if (range) {
        newRange = getZoomRange(zoom, range, isTimeSeries)
        rangeFilter = buildFilterRange(filter, time_field, newRange)
      }
      const bucketSize = isTimeSeries ? getBucketSize(bucketSizeCache || bucket_size, newRange) : undefined
      if (fetchParamsCache) {
        fetchParamsCache.current.bucketSize = bucketSize
      }

      const globalDslFilter = dslToQueryFilters(globalDsl)
      const globalKqlFilterInSetting = kqlToQueryFilters(kqlFiltersToKql(globalKqlFilters))
      const globalKqlFilterInBar = kqlToQueryFilters(globalKql)
      const globalFiltersObject = filtersToQueryFilters(globalFilters)
      const customDslFilter = dslToQueryFilters(customDsl)
      const customKqlFilter = kqlToQueryFilters(kqlFiltersToKql(customKqlFilters))

      const filter = {
        bool: {
          must: [
            ...(globalDslFilter.must || []), 
            ...(globalKqlFilterInSetting.must || []), 
            ...(globalKqlFilterInBar.must || []), 
            ...(globalFiltersObject.must || []),
            ...(customDslFilter.must || []),
            ...(customKqlFilter.must || [])
          ],
          filter: [
            ...(globalDslFilter.filter || []), 
            ...(globalKqlFilterInSetting.filter || []), 
            ...(globalKqlFilterInBar.filter || []), 
            ...(globalFiltersObject.filter || []),
            ...(customDslFilter.filter || []),
            ...(customKqlFilter.filter || [])
          ],
          should: [
            ...(globalDslFilter.should || []), 
            ...(globalKqlFilterInSetting.should || []), 
            ...(globalKqlFilterInBar.should || []), 
            ...(globalFiltersObject.should || []),
            ...(customDslFilter.should || []),
            ...(customKqlFilter.should || [])
          ],
          must_not: [
            ...(globalDslFilter.must_not || []), 
            ...(globalKqlFilterInSetting.must_not || []), 
            ...(globalKqlFilterInBar.must_not || []), 
            ...(globalFiltersObject.must_not || []),
            ...(customDslFilter.must_not || []),
            ...(customKqlFilter.must_not || [])
          ],
        }
      }

      if (rangeFilter) {
        filter.bool.must.push(rangeFilter)
      }

      if (type === 'table') {
        const params = {
          index: indices.join(','),
          body: {
            from: queryFrom || 0,
            query: filter,
            size: page_size || 20,
          }
        }
        if (time_field) {
          let newTimeFieldOrder = {[time_field]: {order: "desc"}}
          if (timeFieldOrder && timeFieldOrder.length === 2) {
            newTimeFieldOrder = {[time_field]: {order: timeFieldOrder[1]}}
          }
          params.body.sort = [newTimeFieldOrder].concat(orders)
        } else {
          params.body.sort =  orders
        }
        const res = await fetchESRequest(params, cluster_id);
        if (res) {
          if (!res.hits || res.error) {
            res.hits = { hits: [] };
          }
          res.hits.hits = res.hits.hits || [];
          setData(res.hits)
        }
      } else {
        const bodys = metrics.map((item) => {
          const { groups = [] } = item;
          let newGroups = cloneDeep(groups);
          if (is_layered && newGroups.length > 1) {
            if (layer_index) {
              newGroups = newGroups.slice(0, layer_index + 1)
            } else {
              newGroups = newGroups.slice(0, 1)
            }
          }
          return { 
            cluster_id,
            filter,
            index_pattern: indices.join(','),
            time_field: time_field,
            ...item,
            items: item.items || [],
            groups: newGroups,
            sort: item.sort || [],
            formula: item.formula || 'a',
            bucket_size: bucketSize,
          }
        })
        const promises = bodys.map((item) => getWidgetData(item))
        const res = await Promise.all(promises)
        if (res) {
          if (res.some((item) => item.status === 403)) {
            setData({ error: 403 })
            setLoading(false);
            return;
          }
          const newData = res.map((item) => Array.isArray(item) ? item : []);
          let group_mapping
          if (is_layered) {
            group_mapping = group_labels[layer_index]
          } else {
            group_mapping = group_labels[0]
          }
          if (group_mapping?.enabled && group_mapping?.template) {
            const groups = [];
            newData.forEach((item) => {
              item.forEach((v) => {
                if (v.groups?.length > 0) {
                  const key = v.groups.join('-')
                  if (!groups.find((g) => g.key === key)) {
                    groups.push({
                      key,
                      value: {
                        group_values: v.groups
                      }
                    })
                  }
                }
              })
            })
            if (groups.length > 0) {
              const group_mappings = await request(`/elasticsearch/${cluster_id}/map_label/_render/`,{
                  method: 'POST',
                  body: {
                    contexts: groups,
                    template: group_mapping.template
                  },
              });
              if (group_mappings?.labels) {
                newData.forEach((item) => {
                  item.forEach((v) => {
                    if (v.groups?.length > 0) {
                      const key = v.groups.join('-')
                      if (group_mappings.labels[key]) {
                        v.groupMapping = group_mappings.labels[key]
                      }
                    }
                  })
                })
              }
            }
          }
          setData(newData)
        } else {
          setData([])
        }
      }
      setLoading(false);
    }

    const buildFilterRange = (filter, timeFieldName, range) => {
      if (timeFieldName && range.from && range.to) {
        const bounds = calculateBounds(range, { forceNow: getForceNow() });
        if (bounds) {
          return {
            range: {
              [timeFieldName] : {
                ...(bounds.min && { gte: bounds.min.toISOString() }),
                ...(bounds.max && { lte: bounds.max.toISOString() }),
                format: 'strict_date_optional_time',
              }
            }
          }
        }
      }
    }

    const getBucketSize = (interval, range) => {
      if (!range || !range.from || !range.to) return
      timefilter.setTime(range)
      return getTimeBuckets(interval).getInterval(true).expression;
    };

    const getZoomRange = (zoom, range, isTimeSeries) => {
      if (!zoom || !range || !isTimeSeries || !zoomCache) return range;

      const lastCache = zoomCache[zoom - 1];

      const { dataCache, rangeCache } = lastCache

      if (!dataCache || dataCache.length === 0) return range;

      const factor = 0.25
      const from = dataCache[0].timestamp
      const to = dataCache[dataCache.length-1].timestamp
      const distance = Math.floor((to - from) / 2)
      let newFrom = from + distance * factor
      let newTo = to - distance * factor
      const midTime = dataCache[Math.floor(dataCache.length / 2)].timestamp;
      if (midTime) {
        if (newFrom >= midTime) {
          newFrom = midTime;
        }
        if (newTo <= midTime) {
          newTo = midTime
        }
      }
      const newRange = {
        from: moment(newFrom).toISOString(),
        to: moment(newTo).toISOString()
      }
      const newZoomCache = [...zoomCache]
      newZoomCache[zoom] = {
        rangeCache: { ...newRange }
      }
      onZoomCacheUpdate(newZoomCache)
      return newRange
    }

    const onChartReady = (chart) => {
      chartRef.current = chart;
      const fixDom = chart.container?.firstChild
      if (fixDom?.style.position === 'relative') {
        fixDom.style.position = 'static'
      }
    }

    useEffect(() => {
      isLockRef.current = isEdit || isFullScreen
    }, [isEdit, isFullScreen])

    const onChartElementClick = (data, callback) => {
      if (isLockRef.current) return;
      const { series = [], drilling = {}, is_layered, layer_index = 0 } = record;
      const { metric = {} } = series[0]
      const { groups = [] } = metric;
      const { indices = [], range, filters: globalFilters = [] } = currentParams?.currentQueries || {};
      if (!data || groups.length === 0) return;
      const { groups: groupsValue } = data;
      const cloneFilters = cloneDeep(globalFilters);
      const newFilters = []
      let newGroups;
      if (is_layered) {
        newGroups = groups.filter((item, index) => index === layer_index)
      } else {
        newGroups = groups;
        if (newGroups.length !== groupsValue.length) return;
      }
      newGroups.forEach((group, index) => {
        newFilters.push(generateFilter(
          cloneFilters,
          group.field,
          groupsValue[index],
          '+',
          undefined
        ))
      })
      callback({filters: newFilters})
    }

    const renderChart = () => {
      const empty = (
        <div style={{ display: 'flex', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center'}}>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: 0}}/>
        </div>
      )
      if (!currentParams?.currentQueries) return empty;
      const { id, title, bucket_size, series = [] } = record;
      const { type } = series[0] || {}
      const { range, bucketSizeCache } = currentParams.currentQueries;
      const bucketSize = currentParams?.isTimeSeries ? getBucketSize(bucketSizeCache || bucket_size, range) : undefined
      const widget = WIDGETS.find((w) => w.type === type);
      let isGroup = false;
      if (result.data?.[0]?.group) {
        isGroup = true
      };
      if (
        (type === 'table' && (!result.data || !result.data.hits || result.data.hits.length === 0))
        ||
        (!['table', 'iframe'].includes(type) && (!result.data || result.data.length === 0))
      ){
          return loading ? null : empty;
      }
      if (widget?.component) {
          return (
            <widget.component 
              record={record} 
              onRecordChange={onRecordChange}
              result={result} 
              options={{
                onQueryFromChange: (queryFrom) => {
                  fetchData({ ...(currentParams || {}), queryFrom }, zoom, true)
                },
                onTimeFieldOrderChange: (order) => {
                  fetchData({ ...(currentParams || {}), queryFrom: 0, timeFieldOrder: order }, zoom, true)
                }
              }} 
              isGroup={isGroup} 
              onReady={onChartReady}
              bucketSize={bucketSize}
              isTimeSeries={currentParams?.isTimeSeries}
              highlightRange={highlightRange}
              currentQueries={currentParams?.currentQueries || {}}
              isLock={isEdit || isFullScreen}
              isEdit={isEdit}
              isFullScreen={isFullScreen}
              handleContextMenu={handleContextMenu}
              onChartElementClick={onChartElementClick}
            />
          )
      }
      return null;
    }

    const getCurrentQueries = (globalQueries, customQueries, globalRangeCache) => {
      const globalRange = globalRangeCache || globalQueries.range
      const bucketSizeCache = globalRangeCache ? 'auto' : undefined
      const { cluster_id, indices, time_field, range, kql_filters = [], dsl, query } = customQueries

      const isGlobalDataSource = !(cluster_id && indices.length > 0)

      const newQueries = {
        cluster_id: isGlobalDataSource ? globalQueries.cluster_id : cluster_id,
        indices: isGlobalDataSource ? globalQueries.indices : indices,
        time_field: time_field || globalQueries.time_field,
        range: range || globalRange,
        bucketSizeCache
      }
      if (!dsl && kql_filters.length === 0 && !query) {
        if (globalQueries.dsl || globalQueries.query) {
          newQueries.globalDsl = globalQueries.dsl || globalQueries.query
        } else {
          newQueries.globalKqlFilters = globalQueries.kql_filters
        }
        newQueries.globalKql = globalQueries.kuery
        newQueries.globalFilters = globalQueries.filters
      } else {
        if (dsl || query) {
          newQueries.customDsl = dsl || query
        } else {
          newQueries.customKqlFilters = kql_filters
        }
      }

      return newQueries
    }

    useEffect(() => {
      const { 
        id, title, position, bucket_size, group_mapping = {}, 
        order, size, page_size, series = [],
        is_layered, layer_index, group_labels = []
      } = record;
      const { type, queries = {}, columns = [] } = series[0] || {}
      const currentQueries = getCurrentQueries(globalQueries, queries, globalRangeCache)
      const widgetPlugin = WIDGETS.find((w) => w.type === type);
      const newParams = {
        currentQueries,
        bucket_size,
        group_mapping,
        order, 
        size,
        page_size,
        metrics: series.map((item) => ({
          ...(item.metric || {})
        })),
        type,
        orders: columns.filter((item) => !!item.order).map((item) => ({[item.name]: { order: item.order }})),
        isTimeSeries: widgetPlugin?.isTimeSeries,
        is_layered,
        layer_index,
        group_labels
      }
      setCurrentParams(newParams)
    }, [JSON.stringify(record), JSON.stringify(globalQueries), JSON.stringify(globalRangeCache)])

    useEffect(() => {
      fetchData(currentParams, zoom, refresh)
    }, [JSON.stringify(currentParams), zoom, refresh])

    const result = useMemo(() => {
      if (data?.error) return data;
      const { order, size, series = [], is_percent } = record;
      const { type } = series[0] || {}

      const isXY = ['area', 'line', 'column', 'bar', 'date-histogram', 'date-bar'].includes(type)

      if (type === 'table' && !Array.isArray(data)) {
        return { data: !Array.isArray(data) ? (data || {}) : {} }
      }

      const isSingleMetric = series.length === 1;

      let newData = Array.isArray(data) ? data : [];
      if (Number.isInteger(size)) {
        newData = newData.map((item) => { 
          item = Array.isArray(item) ? item : [];
          if(order == "desc"){
            item.sort((a, b)=> b.value - a.value);
          }
          if(order == "asc"){
            item.sort((a, b)=> a.value - b.value);
          }
          return item.slice(0, size);
        });
      }

      newData = newData.map((item, index) => (
        Array.isArray(item) ? item.map((child) => (
            { ...child, name: series[index]?.metric?.name || `Metric ${index+1}`, group: child.groupMapping || child.groups?.join('-')}
        )) : []
      )).flat(Infinity);

      const isGroup = newData[0]?.group ? true : false;

      if (!isGroup && newData[0]?.groups?.length > 0) {
        return { data: [] }
      }
      
      if (isXY) {

        if (currentParams?.isTimeSeries) {
          if (isGroup) {
            newData = newData.map((item) => ({
              ...item,
              name: isSingleMetric ? item.group : `${item.group}-${item.name}`,
            }))
          }
        } else {
          if (isGroup) {
            newData = newData.map((item) => ({
              ...item,
              name: isSingleMetric ? item.name : `${item.name}`,
            }))
          } else {
            newData = newData.map((item) => ({
              ...item,
              group: item.name
            }))
          }
        }

      }
      if (order === "desc") {
        newData = newData.sort((a, b) => b.value - a.value)
      }

      if (order === "asc") {
        newData = newData.sort((a, b) => a.value - b.value)
      }


      let result = { data: newData };

      if (zoomCache) {
        const newZoomCache = [...zoomCache]
        newZoomCache[zoom] = {
          ...(zoomCache[zoom] || {}),
          dataCache: result.data,
        }
        onZoomCacheUpdate(newZoomCache)
      }
      
      return result;
    }, [JSON.stringify(data), JSON.stringify(record), zoom, currentParams?.isTimeSeries])

    return (
      <>
        { result?.error === 403 ? <Chart403 /> : renderChart() }
      </>
    )
}