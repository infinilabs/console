import React, {
  useState,
  useMemo,
  useRef,
  useReducer,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
  Fragment,
} from "react";
import { Card, Table, Button, Input, Icon, Switch, Empty, Spin } from "antd";
import styles from "./index.less";
import { formatMessage, getLocale } from "umi/locale";
import { getTimezone } from "@/utils/utils";
import { Route } from "umi";
import { JsonParam, useQueryParam, QueryParamProvider } from "use-query-params";
import { ESPrefix } from "@/services/common";
import useFetch from "@/lib/hooks/use_fetch";
import request from "@/utils/request";
import Side from "./components/Side";
import RowSelect from "./components/RowSelect";
import SortBy from "./components/SortBy";
import ViewDropdown from "./components/ViewDropdown";
import Search from "./components/Search";
import DatePicker from "./components/DatePicker";
import TimeLine from "./components/TimeLine";
import useResizeObserver from "@react-hook/resize-observer";
import { WidgetRender } from "@/pages/DataManagement/View/WidgetLoader";

const Index = forwardRef((props, ref) => {
  const {
    clusterID,
    collectionName,
    columns,
    formatDataSource = null,
    defaultQueryParams = {
      from: 0,
      size: 10,
      timeRange: { from: "now-7d", to: "now", timeField: "" },
    },
    queryFilter = null,
    dateTimeEnable = false,
    isRefreshPaused = true,
    sortEnable = true,
    sideEnable = false,
    sideVisible = false,
    sidePlacement = "left",
    histogramEnable = false,
    histogramVisible = false,
    histogramWidget = {},
    viewLayout = "table",
    viewLayouts = [],
    viewLayoutItemRender = null,
    headerToobarExtra = {},
    rowSelectionExtra = {},
    onRow = null,
    showEmptyUI = false,
    setShowEmptyUI = null,
  } = props;

  const headerExtra = headerToobarExtra.getExtra
    ? headerToobarExtra.getExtra(props)
    : [];
  const rowMultiSelectExtra = rowSelectionExtra.getExtra
    ? rowSelectionExtra.getExtra(props)
    : [];

  const [param, setParam] = useQueryParam("_g", JsonParam);
  const [queryParams, setQueryParams] = useState({
    ...defaultQueryParams,
    ...param,
    from: viewLayout === 'timeline' ? 0 : (defaultQueryParams.from ?? param.from)
  });
  const [histogramState, setHistogramState] = useState({
    visible: histogramVisible,
    widget: histogramWidget,
    range: defaultQueryParams.timeRange,
  });
  useEffect(() => {
    if (histogramEnable) {
      setHistogramState((st) => ({ ...st, widget: histogramWidget }));
    }
  }, [histogramEnable, histogramWidget]);
  const onHistogramVisibleClick = (checked) => {
    setHistogramState({ ...histogramState, visible: checked });
  };
  const [sideState, setSideState] = useState({
    visible: sideVisible,
    placement: sidePlacement,
  });
  const onSideVisibleClick = () => {
    setSideState({ ...sideState, visible: !sideState.visible });
  };

  const [urls] = useMemo(
    (item) => {
      return [
        {
          search_ese: `/collection/${collectionName}/_search`,
          auto_fit: `${ESPrefix}/${clusterID}/visualization/preview`,
        },
      ];
    },
    [clusterID]
  );

  const [columnsNew, sortOptions, aggOptions, searchFields] = useMemo(() => {
    let columnsNew = [];
    let sortOptions = [];
    let aggOptions = [];
    let searchFields = [];
    columns?.map((item) => {
      if (item?.sortable) {
        item.sorter = true; //antd 服务端排序
        sortOptions.push({
          label: item.title,
          key: item.key,
        });
      }
      if (item?.aggregable) {
        aggOptions.push({
          label: item.title,
          field: item.key,
          size: item?.aggSize || 100,
        });
      }
      if (item?.searchable) {
        searchFields.push(item.key);
      }
      if (!item.hasOwnProperty("visible") || item.visible === true) {
        item.dataIndex = item.key;
        columnsNew.push(item);
      }
    });

    return [columnsNew, sortOptions, aggOptions, searchFields];
  }, [columns]);

  const formatAggs = useMemo(() => {
    let aggsJson = {};
    let aggsArr = sideEnable ? aggOptions : [];
    aggsArr.map((item) => {
      aggsJson[item.label] = {
        terms: {
          field: item.field,
          size: item.size,
        },
      };
    });
    return aggsJson;
  }, [sideEnable, aggOptions]);

  const formatQueryBody = (queryParams) => {
    //query
    let must = queryFilter ? [queryFilter] : [];
    if (queryParams?.filters) {
      Object.keys(queryParams.filters).map((field) => {
        let values = queryParams.filters[field];
        let should = values.map((item) => {
          let term = {};
          term[field] = { value: item };
          return { term };
        });
        must.push({
          bool: { should: should },
        });
      });
    }

    let filter = [];
    //time range
    if (queryParams?.timeRange && queryParams?.timeRange?.timeField) {
      let range = {};
      range[queryParams.timeRange.timeField] = {
        gte: queryParams.timeRange.from,
        lte: queryParams.timeRange.to,
      };
      filter.push({
        range,
      });
    }
    //query match
    if (queryParams?.keyword) {
      let query_string = {
        query: `*${queryParams.keyword}*`,
        fields: searchFields,
      };
      filter.push({ query_string });
    }

    //sort by
    let sort = [];
    if (queryParams?.sort && queryParams?.sort.length > 0) {
      sort = queryParams.sort.map((item) => {
        let sortJson = {};
        sortJson[item[0]] = {
          order: item[1],
        };
        return sortJson;
      });
    }
    return {
      query: {
        bool: {
          must: must,
          filter: filter,
          should: [],
          must_not: [],
        },
      },
      from: queryParams.from,
      size: queryParams.size,
      highlight: {
        pre_tags: ["@highlighted-field@"],
        post_tags: ["@/highlighted-field@"],
        fields: {
          "*": {},
        },
      },
      sort: sort,
      aggs: formatAggs,
    };
  };

  const { run, loading, error, value } = useFetch(
    urls.search_ese,
    {
      method: "POST",
      body: formatQueryBody(queryParams),
    },
    [queryParams]
  );

  const getIndexTotal = async () => {
    const res = await request(urls.search_ese, {
      method: "POST",
      body: {
        size: 0,
      },
    });
    return res?.hits?.total?.value || 0;
  };
  const [dataSource, setDataSource] = useState({});
  useMemo(async () => {
    let ds = value;
    // console.log("dataSource:", value);
    if (typeof setShowEmptyUI == "function") {
      // 判断是否要显示 Empty Guide UI 界面
      let body = formatQueryBody(queryParams);
      let queryBool = body.query.bool;
      if (!showEmptyUI && value?.hits?.total?.value == 0) {
        if (
          queryBool.must.length == 0 &&
          queryBool.filter.length == 0 &&
          queryBool.should.length == 0 &&
          queryBool.must_not.length == 0
        ) {
          setShowEmptyUI(true);
        } else {
          if (!queryParams?.keyword) {
            let indexTotal = await getIndexTotal();
            if (!showEmptyUI && indexTotal == 0) {
              setShowEmptyUI(true);
            }
          }
        }
      }
      if (showEmptyUI && value?.hits?.total?.value > 0) {
        setShowEmptyUI(false);
      }
    }

    if (typeof formatDataSource == "function") {
      ds = await formatDataSource(value);
    }
    setDataSource({ ...ds });
  }, [value]);

  const defaultSelectedRows = {
    rowKeys: [],
    rows: [],
  };
  const [selectedRows, setSelectedRows] = useState(defaultSelectedRows);
  const onSelectChange = (selectedRowKeys, selectedRows) => {
    setSelectedRows((st) => ({
      ...st,
      rowKeys: selectedRowKeys,
      rows: selectedRows,
    }));
  };
  const clearSelectedRows = () => {
    setSelectedRows(defaultSelectedRows);
  };
  const rowSelection = {
    selectedRowKeys: selectedRows.rowKeys,
    onChange: onSelectChange,
  };

  const onSearch = (value) => {
    setQueryParams((st) => ({ ...st, from: 0, keyword: value }));
  };

  const onPageChange = (value) => {
    setQueryParams((st) => ({
      ...st,
      from: (value - 1) * st.size,
    }));
  };
  const onPageSizeChange = (value) => {
    setQueryParams((st) => ({ ...st, size: value }));
  };

  const onNext = (value) => {
    setQueryParams((st) => ({ ...st, from: value }));
  };

  const onRefresh = () => {
    run();
  };

  const onFacetChange = (v) => {
    const { filters = {}, ...restParams } = queryParams;
    if (!v.value || v.value.length === 0) {
      delete filters[v.field];
    } else {
      filters[v.field] = v.value;
    }
    if (Object.keys(filters).length === 0) {
      setQueryParams((st) => ({ ...st, from: 0 }));
    } else {
      setQueryParams((st) => ({ ...st, from: 0, filters }));
    }
  };

  const onSideReset = () => {
    setQueryParams((st) => ({ ...st, filters: {} }));
  };

  const onTableChange = (pagination, filters, sorter, extra) => {
    let sortOrder = sorter.order ? sorter.order.replace("end", "") : null;
    let isSortByChange = true;
    if (queryParams?.sort) {
      queryParams?.sort?.map((item) => {
        if (item[0] == sorter.field && item[1] == sortOrder) {
          isSortByChange = false;
        }
      });
    }
    if (isSortByChange) {
      if (sorter.order) {
        onSortByChange([[sorter.field, sortOrder]]);
      } else {
        onSortByChange([]);
      }
    }
  };

  const onSortByChange = (value) => {
    setQueryParams((st) => ({ ...st, sort: value }));
  };

  const onTimeRangeChange = ({ start, end, timeField }) => {
    setQueryParams((st) => ({
      ...st,
      from: 0,
      timeRange: {
        from: start,
        to: end,
        timeField: timeField,
      },
    }));
    if (histogramEnable) {
      let range = {
        from: start,
        to: end,
      };
      let series = histogramState.widget?.series?.map((item) => {
        item.queries.time_field = timeField;
        return item;
      });
      let widget = { ...histogramState.widget, series };
      setHistogramState({ ...histogramState, widget, range });
    }
  };

  useEffect(() => {
    setParam((st) => ({ ...st, ...queryParams }));
  }, [queryParams]);

  //用 useImperativeHandle 暴露一些外部 ref 能访问的属性
  useImperativeHandle(ref, () => ({
    refresh: () => onRefresh(),
    setDataSource: setDataSource,
    selectedRows: selectedRows,
    clearSelectedRows: clearSelectedRows,
  }));

  const contentWrapRef = useRef(null);
  const useSize = (target) => {
    const [size, setSize] = React.useState();

    React.useLayoutEffect(() => {
      setSize(target.current.getBoundingClientRect());
    }, [target]);

    useResizeObserver(target, (entry) => setSize(entry.contentRect));
    return size;
  };
  const contentWrapSize = useSize(contentWrapRef);

  return (
    <div
      className={`${styles.listWrap} ${
        sideState.placement == "left" ? styles.sideLeft : styles.sideRight
      } ${sideEnable && sideState.visible ? styles.expand : styles.collapse}`}
    >
      {sideEnable && aggOptions.length > 0 ? (
        <div className={styles.sideWrap}>
          <Side
            aggs={formatAggs}
            data={dataSource.aggregations || {}}
            filters={queryParams?.filters || {}}
            onFacetChange={onFacetChange}
            onReset={onSideReset}
          />
        </div>
      ) : null}
      <div className={styles.contentWrap} ref={contentWrapRef}>
        <div className={styles.content}>
          {sideEnable && aggOptions.length > 0 ? (
            <span
              className={styles.expandAndCollapse}
              onClick={onSideVisibleClick}
              title={
                sideState.visible
                  ? formatMessage({ id: "listview.side.button.collapse" })
                  : formatMessage({ id: "listview.side.button.expand" })
              }
            >
              <Icon
                type={
                  sideState.placement == "left"
                    ? sideState.visible
                      ? "left"
                      : "right"
                    : sideState.visible
                    ? "right"
                    : "left"
                }
                style={{ fontSize: 12 }}
              />
            </span>
          ) : null}
          <Card>
            <div className={styles.searchActions}>
              <div className={styles.searchBox}>
                <Search
                  value={queryParams?.keyword}
                  onSearch={onSearch}
                  placeholder={formatMessage({
                    id: "listview.search.placeholder",
                  })}
                />
              </div>
              <div className={styles.extraBox}>
                {dateTimeEnable ? (
                  <DatePicker
                    locale={getLocale()}
                    timeZone={getTimezone()}
                    timeFields={
                      queryParams?.timeRange?.timeField
                        ? [queryParams?.timeRange?.timeField]
                        : []
                    }
                    timeRange={queryParams?.timeRange || {}}
                    onTimeRangeChange={onTimeRangeChange}
                    isRefreshPaused={isRefreshPaused}
                    recentlyUsedRangesKey={collectionName}
                  />
                ) : null}
                <Button
                  icon="redo"
                  onClick={() => {
                    onRefresh();
                  }}
                >
                  {formatMessage({ id: "form.button.refresh" })}
                </Button>
                {headerExtra.map((item, i) => (
                  <Fragment key={i}>{item}</Fragment>
                ))}
              </div>
            </div>
            <div className={styles.toolbarWrap}>
              <div>
                {formatMessage(
                  { id: "listview.search.response.tip" },
                  {
                    total: dataSource?.total?.value || 0,
                    took: dataSource?.took || 0,
                  }
                )}
              </div>
              <div className={styles.toolbar}>
                {sortEnable && sortOptions.length > 0 ? (
                  <SortBy
                    options={sortOptions}
                    value={queryParams?.sort || []}
                    onChange={onSortByChange}
                  />
                ) : null}
                {histogramEnable ? (
                  <div className={styles.toolbarItem}>
                    <Icon type="bar-chart" />
                    <span>{formatMessage({ id: "listview.histogram" })}</span>
                    <Switch
                      size="small"
                      checked={histogramState.visible}
                      onChange={onHistogramVisibleClick}
                    />
                  </div>
                ) : null}
                {/* {viewLayouts.length == 0 ? <ViewDropdown /> : null} */}
              </div>
            </div>
            {histogramEnable ? (
              <div
                className={styles.histogramWrap}
                style={{ display: histogramState.visible ? "block" : "none" }}
              >
                <WidgetRender
                  widget={histogramState.widget}
                  range={histogramState.range}
                  queryParams={queryParams?.filters || {}}
                />
              </div>
            ) : null}

            <div className={styles.searchResult}>
              {viewLayout == "table" ? (
                <Table
                  size={"small"}
                  loading={loading}
                  columns={columnsNew}
                  dataSource={dataSource?.data || []}
                  rowKey={"id"}
                  onChange={onTableChange}
                  pagination={{
                    size: "small",
                    pageSize: queryParams.size,
                    total: dataSource?.total?.value || dataSource?.total || 0,
                    onChange: (page, pageSize) => onPageChange(page),
                    showSizeChanger: true,
                    onShowSizeChange: (_, size) => {
                      onPageSizeChange(size);
                    },
                    showTotal: (total, range) =>
                      `${range[0]}-${range[1]} of ${total} items`,
                  }}
                  expandedRowRender={null}
                  rowSelection={
                    rowMultiSelectExtra.length > 0 ? rowSelection : null
                  }
                  onRow={onRow}
                />
              ) : null}
              {viewLayout == "timeline" ? (
                <TimeLine
                  loading={loading}
                  onNext={onNext}
                  from={queryParams.from}
                  itemRender={viewLayoutItemRender}
                  data={dataSource?.data || []}
                  total={dataSource?.total?.value || dataSource?.total || 0}
                />
              ) : null}
            </div>
          </Card>
        </div>
        {rowMultiSelectExtra.length > 0 ? (
          <RowSelect
            style={{
              width: contentWrapSize?.width || "100%",
              marginBottom:
                contentWrapSize?.height &&
                window.innerHeight - contentWrapSize.height - 130 - 40 > 0
                  ? window.innerHeight - contentWrapSize.height - 130 - 40
                  : 0,
            }}
            rowSize={selectedRows.rowKeys.length}
            onUnselect={clearSelectedRows}
            extra={rowMultiSelectExtra}
          />
        ) : null}
      </div>
    </div>
  );
});

export default forwardRef((props, ref) => {
  return (
    <QueryParamProvider ReactRouterRoute={Route}>
      <Index {...props} ref={ref} />
    </QueryParamProvider>
  );
});
