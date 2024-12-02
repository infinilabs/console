import moment from "moment";
import styles from "./Visualization.less"
import { findBytesUnit, findMaxNumberUnit, formatFloat, formatTime } from "../utils";
import Table from "@/components/vendor/discover/public/application/components/discover_table/table";
import { useEffect, useRef, useState } from "react";
import { getContext } from "@/pages/DataManagement/context";
import { ESPrefix } from "@/services/common";
import "./Discover.scss";
import request from "@/utils/request";
import { TYPE_DATA_DRILLING, TYPE_FIELD_FILTER } from "../../../components/ContextMenu";
import { generateFilter } from "../../../components/QueriesBar/generate_filters";
import { formatMessage } from "umi/locale";
import { Dropdown, Icon, Menu } from "antd";
import Fork from "@/components/Icons/Fork";
import { cloneDeep } from "lodash";
import DropdownMenu from "../../../components/DropdownMenu";

const formatters = {
  'date': (value) => moment(value).format('YYYY-MM-DD HH:mm:ss.SSS'),
  'percent': (value) => {
    if (typeof value !== 'number') return value;
    return `${formatFloat(value, 0)}%`
  },
  'number': (value) => {
    if (typeof value !== 'number') return value;
    const maxNumberUnit = findMaxNumberUnit(value);
    return `${formatFloat(value / maxNumberUnit.factor, 2)}${maxNumberUnit.unit}`
  },
  'bytes': (value) => {
    if (typeof value !== 'number') return value;
    const unit = findBytesUnit(value)
    return `${formatFloat(formatUnitToUnit(item.value, UNIT_BYTES, unit), 2)}${unit}`
  }
}

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
} = getContext();

export default (props) => {

    const { record, onRecordChange, result, isLock, options, isGroup, onReady, bucketSize, isTimeSeries, currentQueries, actions, handleContextMenu } = props;
    
    const { cluster_id, indices = [], time_field, range, query, filters: globalFilters = [] } = currentQueries;

    const { onQueryFromChange, onTimeFieldOrderChange } = options;

    const [indexPattern, setIndexPattern] = useState();

    const [scrollTop, setScrollTop] = useState()

    const observeRef = useRef(null)

    const [tableCache, setTableCache] = useState({ hits: [], queryFrom: 0, timeFieldOrder: time_field ? [time_field, 'desc'] : undefined })

    const { id, series = [], page_size, drilling = {} } = record;

    const { columns = [] } = series[0] || {}

    const fetchIndexPattern = async (index, cluster_id) => {
      if (!index || !cluster_id) return;
      try {
        const { http } = getContext();
        http.getServerBasePath = () => {
          return `${ESPrefix}/` + cluster_id;
        };
        const indexPattern = await services.indexPatternService.get(
          index,
          "index",
          cluster_id
        );
        if (!indexPattern) return;
        indexPattern.timeFieldName = time_field
        setIndexPattern(indexPattern)
      } catch (err) {
        console.log(err);
      }

    }

    const onColumnsChange = (columns) => {
      const newRecord = { ...record };
      const { id, title, series = [] } = newRecord;
      const { type, queries = {} } = series[0] || {}
      newRecord.series = [{
        columns,
        type,
        queries,
      }]
      onRecordChange(newRecord)
    }

    const onAddColumn = (name) => {
      const field = indexPattern.fields.getByName(name);
      if (!field) return;
      const newColumns = columns.map((item) => ({...item}));
      if (newColumns.find((item) => item.name === name)) {
          return;
      }
      newColumns.push({
          name: field.name,
          type: field.type,
      })
      onColumnsChange(newColumns)
    }

    const onRemoveColumn = (name) => {
      const newColumns = columns.map((item) => ({...item}));
      const index = newColumns.findIndex((item) => item.name === name);
      if (index === -1) {
          return;
      }
      newColumns.splice(index, 1)
      onColumnsChange(newColumns)
    }

    const onMoveColumn = (name, newIndex) => {
      const oldIndex = columns.findIndex((item) => item.name === name)
      if (
        newIndex < 0 ||
        newIndex >= columns.length ||
        oldIndex === -1
      ) {
        return;
      }
      const column = columns[oldIndex]
      const newColumns = columns.map((item) => ({...item}));
      newColumns.splice(oldIndex, 1); 
      newColumns.splice(newIndex, 0, column); 
      onColumnsChange(newColumns)
    }

    const onOrderChange = (sortOrder) => {
      const newColumns = columns.map((item) => ({...item}));
      newColumns.forEach((column) => {
        const order = sortOrder.find((item) => item[0] === column.name)
        if (!order) {
          column.order = ""
        } else {
          column.order = order[1]
        }
      })
      if (JSON.stringify(newColumns) !== JSON.stringify(columns)) {
        onColumnsChange(newColumns)
        return;
      }
      if (time_field) {
        const order = sortOrder.find((item) => item[0] === time_field)
        setTableCache({ hits: [], queryFrom: 0, timeFieldOrder: order })
        onTimeFieldOrderChange(order)
      }
    }

    useEffect(() => {
      fetchIndexPattern(indices[0], cluster_id)
    }, [indices[0], cluster_id])

    useEffect(() => {
      setTableCache({ hits: [], queryFrom: 0, timeFieldOrder: time_field ? [time_field, 'desc'] : undefined })
    }, [indices[0], cluster_id, time_field])

    useEffect(() => {
      setTableCache({...tableCache, hits: tableCache.hits.concat(result.data.hits || [])})
    }, [JSON.stringify(result.data.hits)])

    const { hits, queryFrom } = tableCache;
    const hitsTotal = result.data.total?.value || 0 

    useEffect(() => {
      if (!observeRef.current) {
        return;
      }
  
      const resizeObserver = new ResizeObserver(() => {
          const target = observeRef.current.parentNode;
          setScrollTop(target.scrollHeight - target.offsetHeight)
      });
      
      resizeObserver.observe(observeRef.current);
  
      return () => {
        resizeObserver.disconnect();
      }
    }, [observeRef.current])

    useEffect(() => {
      if (scrollTop === 0 && !isLock && hits.length < hitsTotal) {
        const newQueryFrom = tableCache.queryFrom + page_size
        setTableCache({...tableCache, queryFrom: newQueryFrom})
        onQueryFromChange(newQueryFrom)
      }
    }, [scrollTop, isLock, hits.length, hitsTotal, page_size])

    const newColumns = columns.map((item) => item.name)
    const displays = columns.map((item) => item.display)
    const orders = columns.filter((item) => !!item.order).map((item) => [item.name, item.order])
    const scrollableTargetID = `dashboard-widget-table-${id}`

    return (
      <div className={styles.table} id={scrollableTargetID}>
        <div style={{height: 'fit-content'}} ref={observeRef}>
          {
            cluster_id && indexPattern && (
              <Table
                scrollableTarget={scrollableTargetID}
                hasMore={!isLock }
                columns={newColumns.length > 0 ? newColumns : ['_source']}
                sortOrder={tableCache.timeFieldOrder ? [tableCache.timeFieldOrder].concat(orders) : orders}
                indexPattern={indexPattern}
                hits={hits}
                hitsTotal={hitsTotal}
                queryFrom={queryFrom}
                setQueryFrom={(queryFrom) => {
                  setTableCache({...tableCache, queryFrom})
                  onQueryFromChange(queryFrom)
                }}
                pageSize={page_size}
                onFilter={(field, values, operation) => {}}
                onRemoveColumn={onRemoveColumn}
                onMoveColumn={onMoveColumn}
                onAddColumn={onAddColumn}
                onChangeSortOrder={onOrderChange}
                formatDisplayName={(name) => {
                  const item = columns.find((item) => item.name === name)
                  return item && item.display ? item.display : name
                }}
                formatHit={(name, hit) => {
                  try {
                    const newHit = JSON.parse(JSON.stringify(hit))
                    const item = columns.find((item) => item.name === name)
                    if (item?.formatter) {
                      const func = formatters[item.formatter]
                      if (!func) return;
                      newHit._source[name] = func(newHit._source[name])
                      return newHit
                    } else {
                      return
                    }
                  } catch (error) {
                    return
                  }
                }}
                scrollThreshold={1}
                filterIconRender={(children, params) => {
                  if (isLock) return null;
                  const { field, values, operation} = params;
                  return (
                    <DropdownMenu menu={[
                        { 
                          type: TYPE_FIELD_FILTER,
                          name: formatMessage({id: "dashboard.widget.sub.menu.field.filter"}),
                          icon: <Icon type="filter" />,
                          onClick: () => {
                            const cloneFilters = cloneDeep(globalFilters);
                            const newFilters = generateFilter(
                              cloneFilters,
                              field,
                              values,
                              operation,
                              undefined
                            )
                            handleContextMenu({filters: newFilters}, TYPE_FIELD_FILTER)
                          },
                        },
                        { 
                          type: TYPE_DATA_DRILLING,
                          name: formatMessage({id: "dashboard.widget.sub.menu.data.drilling"}),
                          icon: <Icon component={Fork} />,
                          onClick: () => {
                            if (!drilling.url) return;
                            const urlParams = { field: values }
                            handleContextMenu(urlParams, TYPE_DATA_DRILLING)
                          },
                          disabled: !drilling.url
                        }
                    ]}>
                      {children}
                    </DropdownMenu>
                  )
                }}
              />
            )
          }
        </div>
      </div>
    )
  }