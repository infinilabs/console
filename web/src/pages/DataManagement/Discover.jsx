import React, {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
  createContext,
  useContext,
  useRef,
} from "react";
import classNames from "classnames";

import {
  EuiDataGrid,
  EuiLink,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPopover,
  EuiPopoverTitle,
  EuiButtonIcon,
  EuiSpacer,
  EuiButtonEmpty,
  EuiHideFor,
  EuiHorizontalRule,
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiSelect,
} from "@elastic/eui";
import "@elastic/eui/dist/eui_theme_amsterdam_light.css";
import * as styles from "./discover.scss";
import { Subscription } from "rxjs";
import { connect } from "dva";

import {
  Card,
  Spin,
  message,
  Select,
  Icon,
  Popover,
  Tabs,
  Input,
  Button,
  Empty,
} from "antd";
// import DiscoverGrid from './Components/discover_grid';
import { flattenHitWrapper } from "../../components/vendor/data/common/index_patterns/index_patterns";
import { getStateColumnActions } from "../../components/vendor/discover/public/application/angular/doc_table/actions/columns";
import { DiscoverSidebar } from "../../components/vendor/discover/public/application/components/sidebar/discover_sidebar";
import { HitsCounter } from "../../components/vendor/discover/public/application/components/hits_counter";
import { TimechartHeader } from "../../components/vendor/discover/public/application/components/timechart_header";
import { DiscoverHistogram } from "../../components/vendor/discover/public/application/components/histogram/histogram";
import moment from "moment";
import { getContext } from "./context";
import { createSearchBar } from "../../components/vendor/data/public/ui/search_bar/create_search_bar";
import { LoadingSpinner } from "../../components/vendor/discover/public/application/components/loading_spinner/loading_spinner";
import { DiscoverNoResults } from "../../components/vendor/discover/public/application/angular/directives/no_results";
import { buildPointSeriesData } from "../../components/vendor/discover/public/application/angular/helpers/";
import { generateFilters } from "../../components/vendor/data/public/query/filter_manager/lib/generate_filters";
import Table from "../../components/vendor/discover/public/application/components/discover_table/table";
import { SettingContent } from "./SettingContent";

import {
  useQueryParam,
  StringParam,
  NumberParam,
  QueryParamProvider,
  ArrayParam,
  BooleanParam
} from "use-query-params";
import { Link, Route } from "umi";
import { ESPrefix } from "@/services/common";
import TraceChart from "./trace_chart";
import TraceSearch from "./SearchFlow/TraceSearch";
import InsightBar from "./Insight/InsightBar";
import Visualization from "./Insight/Visualization";
import { useFullScreenHandle } from "@/components/hooks/useFullScreen";
import Layouts from "./Insight/Layouts";
import { getDataTips } from "./Insight/services/elasticsearch";
import { string } from "prop-types";
import { ConfigConsumer } from "antd/es/config-provider";
import Layout from "./View/Layout";
import request from "@/utils/request";
import { cloneDeep } from "lodash";
import { getTimezone } from "@/utils/utils";
import { hasAuthority } from "@/utils/authority";

const SidebarMemoized = React.memo(DiscoverSidebar);

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

const SearchBar = createSearchBar();
let isFrist = true;

const Discover = (props) => {

  if ((props.indexPatternList || [])?.length === 0 && props.indices?.length === 0 ) {
    return null;
  }

  const [timeZone, setTimeZone] = useState(() => getTimezone());
  const [mode, setMode] = useState("table");
  // const [viewLayout, setViewLayout] = useState();
  const insightBarRef = useRef();
  const visRef = useRef();
  // const layoutRef = useRef();
  const rangeCacheRef = useRef();
  const fullScreenHandle = useFullScreenHandle();
  // const [layout, setLayout] = useState(
  //   Layouts.find((item) => item.name === "default")
  // );
  const [timeTipsLoading, setTimeTipsLoading] = useState(false);
  const [insightLoading, setInsightLoading] = useState(false);
  const [showResultCount, setShowResultCount] = useState(true);
  const [selectedQueries, setSelectedQueries] = useState();

  const [columnsParam, setColumnsParam] = useQueryParam("columns", ArrayParam);

  const [queryParam, setQueryParam] = useQueryParam("query", StringParam);
  const [timeParam, setTimeParam] = useQueryParam("time", ArrayParam);
  useEffect(() => {
    timefilter.setTime({
      from: timeParam && timeParam[0] || "now-15m",
      to: timeParam && timeParam[1] || "now",
    });
  }, [])

  const [selectedQueriesId, setSelectedQueriesId] = useQueryParam(
    "sq",
    StringParam
  );
  const [trackTotalHits, setTrackTotalHits] = useQueryParam(
    "tth",
    BooleanParam
  );
  const [timeout, setTimeout] = useState(localStorage.getItem('search_time_out') || '60s');
  const [whetherToSample, setWhetherToSample] = useQueryParam(
    "wts",
    BooleanParam
  );
  const [sampleSize, setSampleSize] = useQueryParam(
    "ss",
    NumberParam
  );
  const [topNumber, setTopNumber] = useQueryParam(
    "tn",
    NumberParam
  );
  const [sampleRecords, setSampleRecords] = useQueryParam(
    "sr",
    StringParam
  );

  //const indexPatternList = [{"type":"index-pattern","id":"c7fbafd0-34a9-11eb-925f-9db57376c4ce","attributes":{"title":".monitoring-es-7-mb-*"},"references":[],"migrationVersion":{"index-pattern":"7.6.0"},"updated_at":"2020-12-02T14:34:38.010Z","version":"WzgyNCw3XQ==","namespaces":["default"],"score":0},{"type":"index-pattern","id":"861ea7f0-3a9b-11eb-9b55-45d33507027a","attributes":{"title":"mock_log*"},"references":[],"migrationVersion":{"index-pattern":"7.6.0"},"updated_at":"2020-12-10T04:09:09.044Z","version":"WzE3NTgsMTBd","namespaces":["default"],"score":0},{"type":"index-pattern","id":"1a28c950-0f6b-11eb-9512-2d0c0eda237d","attributes":{"title":"gateway_requests*"},"references":[],"migrationVersion":{"index-pattern":"7.6.0"},"updated_at":"2021-05-22T11:04:23.811Z","version":"WzkxMTgsNDhd","namespaces":["default"],"score":0},{"type":"index-pattern","id":"1ccce5c0-bb9a-11eb-957b-939add21a246","attributes":{"title":"test-custom*"},"references":[],"migrationVersion":{"index-pattern":"7.6.0"},"updated_at":"2021-05-23T07:40:14.747Z","version":"WzkxOTEsNDhd","namespaces":["default"],"score":0}];
  const [state, setState] = useState({
    columns: columnsParam || ["_source"], //['name', 'address'],
    interval: "15s",
    sort: [],
  });
  const [searchType, setSearchType] = React.useState("normal");

  // const [sort, setSort] = useState(null);

  const distinctParamsDefault = {
    type: "string",
    field: "",
    enabled: false,
  };
  const [distinctParams, setDistinctParams] = React.useState(
    distinctParamsDefault
  );
  const onDistinctParamsChange = (obj) => {
    setDistinctParams({ ...distinctParams, ...obj });
  };
  const resetDistinctParams = () => {
    setDistinctParams({
      ...distinctParams,
      type: distinctParamsDefault.type,
      field: distinctParamsDefault.field,
    });
  };
  useMemo(() => {
    resetDistinctParams();
  }, [props.selectedCluster, props.indexPattern]);

  const subscriptions = useMemo(() => {
    const subscriptions = new Subscription();
    subscriptions.add(
      timefilter.getAutoRefreshFetch$().subscribe({
        next: () => {
          updateQuery();
        },
      })
    );
    return subscriptions;
  }, [props.indexPattern]);
  const setIndexPattern = async (
    id,
    typ,
    { filters, isReset = false, timestamp } = {}
  ) => {
    const IP = await services.indexPatternService.get(
      id,
      typ,
      props.selectedCluster?.id
    );
    subscriptions.unsubscribe();
    props.changeIndexPattern(IP);
    if (IP.timeFieldName) {
      setState({
        ...state,
        columns: ["_source"],
        sort: [[IP.timeFieldName, 'desc']],
      });
    } else {
      setState({
        ...state,
        columns: ["_source"],
        sort: [],
      });
    }
    if (filters && filters.length > 0) {
      if (isReset) {
        filterManager.setFilters(filters);
      } else {
        filterManager.addFilters(filters);
      }
    }
    // updateQuery();
    timefilter.setTime({//change by hardy
      from: "now-15m",
      to: "now",
    });
  };
  const onTimeFieldChange = async (indexPattern, timeField) => {
    const IP = await services.indexPatternService.get(
      indexPattern.id,
      indexPattern.type,
      props.selectedCluster?.id
    );
    subscriptions.unsubscribe();
    IP.timeFieldName = timeField;
    props.changeIndexPattern(IP);
    const newSort = [[timeField, 'desc']]
    setState({
      ...state,
      columns: ["_source"],
      sort: newSort,
    });
    updateQuery({ sort: newSort });
  };

  //const indexPatterns = [{"id":"1ccce5c0-bb9a-11eb-957b-939add21a246","type":"index-pattern","namespaces":["default"],"updated_at":"2021-05-23T07:40:14.747Z","version":"WzkxOTEsNDhd","attributes":{"title":"test-custom*","timeFieldName":"created_at","fields":"[{\"count\":0,\"name\":\"_id\",\"type\":\"string\",\"esTypes\":[\"_id\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":false},{\"count\":0,\"name\":\"_index\",\"type\":\"string\",\"esTypes\":[\"_index\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":false},{\"count\":0,\"name\":\"_score\",\"type\":\"number\",\"scripted\":false,\"searchable\":false,\"aggregatable\":false,\"readFromDocValues\":false},{\"count\":0,\"name\":\"_source\",\"type\":\"_source\",\"esTypes\":[\"_source\"],\"scripted\":false,\"searchable\":false,\"aggregatable\":false,\"readFromDocValues\":false},{\"count\":0,\"name\":\"_type\",\"type\":\"string\",\"esTypes\":[\"_type\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":false},{\"count\":0,\"name\":\"address\",\"type\":\"string\",\"esTypes\":[\"text\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":false,\"readFromDocValues\":false},{\"count\":0,\"name\":\"address.keyword\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true,\"subType\":{\"multi\":{\"parent\":\"address\"}}},{\"count\":0,\"conflictDescriptions\":{\"text\":[\"test-custom1\"],\"long\":[\"test-custom\",\"test-custom8\",\"test-custom9\"]},\"name\":\"age\",\"type\":\"conflict\",\"esTypes\":[\"text\",\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":false},{\"count\":0,\"name\":\"age.keyword\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true,\"subType\":{\"multi\":{\"parent\":\"age\"}}},{\"count\":0,\"name\":\"created_at\",\"type\":\"date\",\"esTypes\":[\"date\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"email\",\"type\":\"string\",\"esTypes\":[\"text\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":false,\"readFromDocValues\":false},{\"count\":0,\"name\":\"email.keyword\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true,\"subType\":{\"multi\":{\"parent\":\"email\"}}},{\"count\":0,\"name\":\"hobbies\",\"type\":\"string\",\"esTypes\":[\"text\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":false,\"readFromDocValues\":false},{\"count\":0,\"name\":\"hobbies.keyword\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true,\"subType\":{\"multi\":{\"parent\":\"hobbies\"}}},{\"count\":0,\"name\":\"id\",\"type\":\"string\",\"esTypes\":[\"text\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":false,\"readFromDocValues\":false},{\"count\":0,\"name\":\"id.keyword\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true,\"subType\":{\"multi\":{\"parent\":\"id\"}}},{\"count\":0,\"name\":\"name\",\"type\":\"string\",\"esTypes\":[\"text\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":false,\"readFromDocValues\":false},{\"count\":0,\"name\":\"name.keyword\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true,\"subType\":{\"multi\":{\"parent\":\"name\"}}}]"},"references":[],"migrationVersion":{"index-pattern":"7.6.0"}}];
  const indexPattern = props.indexPattern;
  const indexPatterns = [indexPattern];
  const indexPatternList = props.indexPatternList;
  const contentCentered = false; //resultState != 'ready';
  const indexPatternRef = React.useRef();
  indexPatternRef.current = indexPattern;

  indexPatterns.get = (id) => {
    return Promise.resolve(indexPatterns.find((ip) => ip.id == id));
  };
  getContext().setIndexPatterns(indexPatterns);

  const [expandedDoc, setExpandedDoc] = useState(undefined);
  const scrollableDesktop = useRef(null);

  const [queryFrom, setQueryFrom] = React.useState(0);

  const columns = state.columns;
  const traceParams = useRef({});

  const updateQuery = useCallback(
    async (_payload) => {
      if (mode === "insight" && indexPattern.timeFieldName) {
        visRef?.current?.refreshMeta(
          props.selectedCluster?.id,
          indexPattern.title,
          indexPattern.timeFieldName,
          getFilters()
        );
      }
      // if (mode === "layout") {
      //   layoutRef?.current?.onRefresh();
      // }
      if (!indexPatternRef.current) {
        return;
      }
      setResultState("loading");
      const traceField = traceParams.current?.trace_field;
      const traceAggField = traceParams.current?.agg_field;
      const traceTimestamp = traceParams.current?.timestamp_field;
      let aggs = null;
      if (traceField && traceAggField && traceTimestamp) {
        const traceFilter = filterManager
          .getFilters()
          .find((f) => f.meta.key == traceField);

        if (traceFilter) {
          aggs = {
            traceid_group: {
              terms: {
                field: traceAggField,
                size: 100,
              },
              aggs: {
                min_timestamp: {
                  min: {
                    field: traceTimestamp,
                  },
                },
              },
            },
          };
        }
      }
      if (!_payload?.isScrollLoad) {
        setQueryFrom(0);
      }

      const params = getSearchParams(
        _payload?.indexPattern || indexPatternRef.current,
        _payload?.interval || state.interval,
        _payload?.sort || state.sort,
        _payload?.aggs || aggs,
        distinctParams || {},
        _payload?.isScrollLoad ? queryFrom : 0,
        trackTotalHits
      );

      const filters = cloneDeep(params?.body?.query?.bool?.filter || [])

      if (filters.length > 0) {
        const rangeFilter = filters[filters.length - 1];
        if (rangeFilter?.hasOwnProperty("range")) {
          if (_payload?.rangeFilter) {
            filters[filters.length - 1] = cloneDeep(_payload?.rangeFilter)
            params.body.query.bool.filter = filters
          } else {
            rangeCacheRef.current = rangeFilter
          }
        }
      }

      const res = await fetchESRequest(
        params,
        props.selectedCluster?.id,
        { 
          searchTimeout: localStorage.getItem('search_time_out') || '60s', 
          ignoreTimeout: true 
        });
        
      if (!res?.hits || res?.error) {
        res.hits = {
          hits: [],
        };
      }
      res.hits.hits = res.hits.hits || [];
      setSearchRes(res);
      const { query } = queryStringManager.getQuery();
      if (query != queryParam) {
        setQueryParam(query);
      }
      setTimeParam([timefilter._time?.from, timefilter._time?.to]);

      // let filters = filterManager.getFilters();
      // const tfilter = timefilter.createFilter(indexPattern);
      // filters = [...filterManager.getFilters(), ...(tfilter ? [tfilter] : [])],

      // console.log(filters)
      // console.log(res)
      //console.log(JSON.stringify(params));
      // console.log(getEsQuery(indexPattern));
      // console.log(timefilter.createFilter(indexPattern));
    },
    [
      state.interval,
      state.sort,
      props.selectedCluster,
      props.indexPattern,
      distinctParams,
      queryFrom,
      mode,
      indexPattern.timeFieldName,
      trackTotalHits,
    ]
  );

  const onQueriesSelect = async (record) => {
    queryStringManager.setQuery(record.query);
    timefilter.setTime(record.time_filter);
    const IP = await services.indexPatternService.get(
      record.index_pattern,
      "index",
      props.selectedCluster?.id
    );
    IP.timeFieldName = record.time_field;
    subscriptions.unsubscribe();
    props.changeIndexPattern(IP);
    const newState = {
      ...state,
      columns: record.filter?.columns || ["_source"],
    }
    if (record.time_field) {
      newState.sort = [[record.time_field, 'desc']]
    }
    setState(newState);
    if (record.filter?.filters?.length > 0) {
      filterManager.setFilters(record.filter?.filters);
    }
    updateQuery();
    setSelectedQueries(record);
    if (selectedQueriesId !== record.id) {
      setSelectedQueriesId(record.id);
    }
  };

  useEffect(() => {
    if (queryFrom > 0) {
      updateQuery({ isScrollLoad: true, rangeFilter: rangeCacheRef.current });
    }
  }, [queryFrom]);
  //cluster changed
  useEffect(() => {
    if (!isFrist) {
      updateQuery();
    } else {
      isFrist = !isFrist;
    }
  }, [props.indices]);

  const onIntervalChange = useCallback(
    (interval) => {
      if (interval) {
        //console.log(calculateInterval(interval))
        setState({ ...state, interval });
      }
    },
    [setState, indexPattern]
  );

  const [searchRes, setSearchRes] = useState({
    took: 11,
    timed_out: false,
    _shards: { total: 4, successful: 4, skipped: 3, failed: 0 },
    hits: { total: 0, max_score: null, hits: [] },
    aggregations: { counts: { buckets: [] } },
  });

  const [resultState, setResultState] = useState("loading");
  const { histogramData, timeChartProps } = useMemo(() => {
    if (!searchRes.hits.hits || searchRes.hits.hits.length == 0) {
      setResultState("none");
      return {};
    }
    if (
      !indexPattern.timeFieldName ||
      !searchRes.aggregations ||
      !searchRes.aggregations["counts"]
    ) {
      setResultState("ready");
      return { histogramData: null, timeChartProps: null };
    }
    const buckets = getTimeBuckets(state.interval);
    const interval = buckets.getInterval(true);
    const chartTable = {
      columns: [
        {
          id: "key",
          name: `${indexPattern?.getTimeField().displayName} per ${
            interval.description
          }`,
        },
        { id: "doc_count", name: "count" },
      ],
      rows: [],
    };
    let aggregations = searchRes.aggregations;

    aggregations["counts"].buckets.forEach((bk) => {
      chartTable.rows.push(bk);
    });

    //console.log(interval, moment.duration('1', 'd'))
    const dimensions = {
      x: {
        accessor: 0,
        format: {
          id: "date",
          params: {
            pattern: buckets.getScaledDateFormat(),
            //pattern: 'YYYY-MM-DD',
          },
        },
        params: {
          date: true,
          interval: moment.duration(interval.esValue, interval.esUnit),
          intervalESValue: interval.esValue,
          intervalESUnit: interval.esUnit,
          bounds: buckets.getBounds(),
        },
      },
      y: {
        accessor: 1,
        format: {
          id: "number",
        },
        label: "Count",
      },
    };
    setResultState("ready");
    const timeChartProps = {
      timeRange: {
        from: timefilter.getBounds().min,
        to: timefilter.getBounds().max,
      },
      stateInterval: state.interval || '15s',
      options: intervalOptions,
      onIntervalChange, //(interval)=>{console.log(interval)},
      bucketInterval: {
        // scaled: true,
        // description: 'day',
        // scale: undefined,
        ...interval,
        timeFieldName: indexPattern.timeFieldName,
      },
    };
    const histogramData = buildPointSeriesData(chartTable, dimensions);
    return { histogramData, timeChartProps };
  }, [searchRes, indexPattern, indexPattern.timeFieldName, state.interval]);

  const traceAgg = useMemo(() => {
    if (!searchRes.aggregations || !searchRes.aggregations.traceid_group) {
      return [];
    }
    const traceidAgg = searchRes.aggregations["traceid_group"];
    const aggField = traceParams.current?.agg_field;
    return (traceidAgg.buckets || [])
      .sort((a, b) => {
        return a.min_timestamp.value < b.min_timestamp.value;
      })
      .map((bk) => {
        return {
          key: bk.key,
          timestamp: moment(bk.min_timestamp.value).toISOString(),
          aggField,
        };
      });
  }, [searchRes]);

  // const setAppState = (newState) => {
  //   if (
  //     state.columns[0] === "_source" ||
  //     newState.columns[0] === "_source" ||
  //     state.columns.length != newState.columns.length
  //   ) {
  //     setColumnsParam(newState.columns);
  //   }
  //   setState((st) => {
  //     return {
  //       ...st,
  //       ...newState,
  //     };
  //   });
  // };
  useEffect(() => {
    setColumnsParam(state.columns);
  }, [state.columns]);

  useEffect(() => {
    if (indexPattern) {
      if (indexPattern.timeFieldName) {
        const newSort = [[indexPattern.timeFieldName, 'desc']]
        setState({
          ...state,
          sort: newSort
        });
        updateQuery({ sort: newSort });
      } else {
        setState({
          ...state,
          sort: []
        });
        updateQuery({ sort: [] });
      }
    }
  }, [indexPattern]);

  const { onAddColumn, onRemoveColumn, onMoveColumn, onSetColumns } = useMemo(
    () =>
      getStateColumnActions({
        indexPattern,
        indexPatterns: [indexPattern],
        setAppState: setState,
        state,
        useNewFieldsApi: false,
      }),
    [indexPattern, state]
  );

  const collapseIcon = useRef(null);
  const [isSidebarClosed, setIsSidebarClosed] = useState(false);
  const useNewFieldsApi = false;

  const onSort = useCallback(
    (nsort) => {
      setState({ ...state, sort: nsort });
      updateQuery({ sort: nsort.reverse() });
    },
    [state, indexPattern]
  );

  const onAddFilter = useCallback(
    (field, values, operation) => {
      const fieldName = typeof field === "string" ? field : field.name;
      const newFilters = generateFilters(
        filterManager,
        field,
        values,
        operation,
        String(indexPattern.id)
      );
      filterManager.addFilters(newFilters);
      updateQuery();
    },
    [indexPattern, updateQuery]
  );
  const toggleFilter = useCallback(
    (field, values, operation) => {
      const fieldName = typeof field === "string" ? field : field.name;
      const newFilters = generateFilters(
        filterManager,
        field,
        values,
        "+",
        String(indexPattern.id)
      );
      if (operation == "add") {
        filterManager.addFilters(newFilters);
      } else {
        filterManager.removeFilter(newFilters[0]);
      }
      updateQuery();
    },
    [indexPattern, updateQuery]
  );

  const timefilterUpdateHandler = useCallback(
    (ranges) => {
      timefilter.setTime({
        from: moment(ranges.from).toISOString(),
        to: moment(ranges.to).toISOString(),
        mode: "absolute",
      });
      updateQuery();
    },
    [timefilter]
  );
  const rows = searchRes.hits.hits || [];
  const [records, setRecords] = useState([]);
  useMemo(() => {
    if (rows.length > 0) {
      if (queryFrom > 0) {
        setRecords([...records, ...rows]);
      } else {
        setRecords(rows);
      }
    } else if (queryFrom === 0) {
      setRecords([]);
    }
  }, [rows]);

  const opts = {
    savedSearch: {},
    timefield: indexPattern?.getTimeField()?.displayName,
    chartAggConfigs: {},
  };
  const fieldCounts = {};
  for (const hit of records) {
    for (const key of Object.keys(indexPattern.flattenHit(hit, true))) {
      fieldCounts[key] = (fieldCounts[key] || 0) + 1;
    }
  }
  const took = searchRes.took || 1;
  const hits = searchRes.hits.total?.value || searchRes.hits.total;
  const resetQuery = () => {};
  const showDatePicker = indexPattern.timeFieldName != "";

  const saveDocument = useCallback(
    async ({ _index, _id, _type, _source, is_new }) => {
      const { http } = getContext();
      const res = await http.put(
        `/elasticsearch/${props.selectedCluster?.id}/doc/${_index}/${_id}`,
        {
          prependBasePath: false,
          query: {
            _type,
            is_new,
          },
          body: JSON.stringify(_source),
        }
      );
      if (!res) {
        return false;
      }
      if (res.error) {
        return res;
      }
      message.success("saved successfully");
      updateQuery();
      return res;
    },
    [props.selectedCluster, updateQuery]
  );

  const deleteDocument = useCallback(
    async ({ _index, _id, _type }) => {
      const { http } = getContext();
      const res = await http.delete(
        `/elasticsearch/${props.selectedCluster?.id}/doc/${_index}/${_id}`,
        {
          prependBasePath: false,
          query: {
            _type,
          },
        }
      );
      if (!res) {
        return false;
      }
      if (res.error) {
        return res;
      }
      message.success("deleted successfully");
      updateQuery();
      return res;
    },
    [props.selectedCluster, updateQuery]
  );
  const document = useMemo(() => {
    return { saveDocument, deleteDocument };
  }, [saveDocument, deleteDocument]);

  const [settingsVisible, setSettingsVisible] = React.useState(false);
  const onTraceIDSearch = React.useCallback(
    async (value, searchFlow) => {
      const { http } = getContext();
      traceParams.current = searchFlow;
      const traceField = searchFlow.trace_field;
      const tiemstampField = searchFlow.timestamp_field;
      const indexNames = await http
        .fetch(http.getServerBasePath() + "/search/trace_id", {
          query: {
            traceID: value,
            traceIndex: searchFlow.meta_index,
            traceField: traceField,
          },
        })
        .catch((err) => {
          console.log(err);
        });
      if (indexNames && indexNames.length > 0) {
        const newFilters = generateFilters(
          filterManager,
          traceField,
          value,
          "+",
          indexNames.join(",")
        );
        setIndexPattern(indexNames.join(","), "index", {
          filters: newFilters,
          isReset: true,
          timestamp: tiemstampField,
        });
        setSearchType("normal");
      } else {
        message.warn("trace data not found");
      }
    },
    [setIndexPattern]
  );

  const getSearchFilters = useCallback(() => {
    const traceField = traceParams.current?.trace_field;
    const traceAggField = traceParams.current?.agg_field;
    const traceTimestamp = traceParams.current?.timestamp_field;
    let aggs = null;
    if (traceField && traceAggField && traceTimestamp) {
      const traceFilter = filterManager
        .getFilters()
        .find((f) => f.meta.key == traceField);

      if (traceFilter) {
        aggs = {
          traceid_group: {
            terms: {
              field: traceAggField,
              size: 100,
            },
            aggs: {
              min_timestamp: {
                min: {
                  field: traceTimestamp,
                },
              },
            },
          },
        };
      }
    }
    const params = getSearchParams(
      indexPatternRef.current,
      state.interval,
      state.sort,
      aggs,
      distinctParams || {},
      0
    );
    return params.body.query;
  }, [traceParams, state.interval, distinctParams]);

  const getBucketSize = useCallback(() => {
    const buckets = getTimeBuckets(state.interval);
    const interval = buckets.getInterval(true);
    return interval.expression;
  }, [state.interval]);

  const onTimeTipsSelect = async () => {
    setTimeTipsLoading(true);
    try {
      const filter = getSearchFilters();
      if (filter?.bool?.filter.length > 0) {
        const newFilter = filter.bool.filter;
        const lastFilter = newFilter[newFilter.length - 1];
        if (lastFilter.range) {
          newFilter.splice(newFilter.length - 1, 1);
          filter.bool.filter = newFilter;
        }
      }
      const res = await getDataTips({
        clusterId: props.selectedCluster?.id,
        indexPattern: indexPattern.title,
        timeField: indexPattern.timeFieldName,
        filter,
      });
      if (res) {
        const { time_fields = {} } = res;
        const keys = Object.keys(time_fields);
        if (time_fields[indexPattern.timeFieldName]) {
          const time = time_fields[indexPattern.timeFieldName];
          if (time.max && time.min) {
            const from = moment(time.max)
              .subtract(15, "m")
              .toISOString();
            const to = moment(time.max).toISOString();
            timefilter.setTime({
              from,
              to,
              mode: "absolute",
            });
            updateQuery();
          }
        }
      }
    } catch (error) {
    } finally {
      setTimeTipsLoading(false);
    }
  };

  // const fetchViewDefaultLayout = async (clusterId, viewId) => {
  //   setInsightLoading(true);
  //   const res = await request(
  //     `/elasticsearch/${clusterId}/saved_objects/view/${viewId}`
  //   );
  //   const layoutId = res?._source?.default_layout_id;
  //   if (layoutId) {
  //     const layout = await request(`/layout/${layoutId}`);
  //     if (layout?._source) {
  //       setViewLayout(layout?._source);
  //     } else {
  //       setViewLayout();
  //     }
  //   } else {
  //     setViewLayout();
  //   }
  //   setInsightLoading(false);
  // };

  const onFieldAgg = async (field, beforeFuc, afterFuc) => {
    let name = field?.spec?.name || field?.name
    if (!name) {
      return;
    }
    if(field.isMulti){
      name = `${name}.keyword`;
    }else{
      if(field?.spec?.aggregatable !== true){
        return
      }
    }
    if (beforeFuc) {
      beforeFuc()
    }

    const dsl_json = sampleRecords === 'all'
      ? {
          "top5": {
            "terms": {
              "field": name,
              "size": topNumber || 5,
            }
          }
        }
      : {
        "sample": {
          "sampler": {
            "shard_size": sampleSize || 5000
          },
          "aggs": {
            "sample_count": {
              "value_count": {
                "field": name,
              }
            },
            "top5": {
              "terms": {
                "field": name,
                "size": topNumber || 5,
                "shard_size": 25
              }
            }
          }
        },
        "top5": {
          "terms": {
            "field": name,
            "size": topNumber || 5,
            "shard_size": 25
          }
        }
      };

    const params = getSearchParams(
      indexPatternRef.current,
      state.interval,
      state.sort,
      dsl_json,
      distinctParams || {},
      0,
      true,
      0
    );

    const filters = params?.body?.query?.bool?.filter || []

    if (filters.length > 0) {
      if (rangeCacheRef.current) {
        const rangeFilter = filters[filters.length - 1];
        const range = cloneDeep(rangeCacheRef.current);
        if (rangeFilter?.hasOwnProperty("range")) {
          filters[filters.length - 1] = range
          params.body.query.bool.filter = filters
        } else {
          filters.push(range)
        }
        params.body.query.bool.filter = filters
      }
    }

    const res = await fetchESRequest(params, props.selectedCluster?.id);
    if (afterFuc) {
      const buckets = sampleRecords === 'all'
        ? res?.aggregations?.['top5']?.buckets
        : res?.aggregations?.sample?.['top5']?.buckets;
      const count = sampleRecords === 'all'
        ? res?.aggregations?.['top5']?.sum_other_doc_count
        : res?.aggregations?.sample?.sample_count?.value;
      afterFuc(buckets || [],  count || 0);
    }
  }

  // useEffect(() => {
  //   if (indexPattern?.type === "view") {
  //     fetchViewDefaultLayout(props.selectedCluster?.id, indexPattern?.id);
  //   } else {
  //     setViewLayout();
  //   }
  // }, [indexPattern, props.selectedCluster?.id]);

  // useEffect(() => {
  //   setMode(viewLayout ? "layout" : "table");
  // }, [viewLayout]);

  // useEffect(() => {
  //   if (mode === "table" && viewLayout) {
  //     setViewLayout();
  //   }
  // }, [mode]);

  // const showLayoutListIcon = useMemo(() => {
  //   return indexPattern?.type === "view";
  // }, [indexPattern]);

  return (
    <div style={{ position: "relative" }}>
      <Card
        bordered={false}
        bodyStyle={{ paddingTop: 10 }}
        loading={insightLoading}
      >
        {/* <Tabs
          animated={false}
          tabPosition="right"
          activeKey={searchType}
          onChange={setSearchType}
          type="card"
        >
          <Tabs.TabPane key="normal" tab="Normal"> */}
        <div className="search_bar" style={{ position: "relative" }}>
          <SearchBar
            {...{
              showSearchBar: false,
              showQueryBar: true,
              showQueryInput: true,
              showDatePicker: showDatePicker,
              showFilterBar: true,
              useDefaultBehaviors: true,
              screenTitle: "",
              // filters: filters,
              onFiltersUpdated: getContext().defaultFiltersUpdated(),
              indexPatterns: [indexPattern],
              filterManager,
              query: {
                language: "kuery",
                query: queryParam || "",
              },
              queryStringManager,
              queryString: queryStringManager,
              timefilter,
              storage,
              onQuerySubmit: updateQuery,
              services,
              dateRangeFrom: timeParam && timeParam[0] || "now-15m", // change by hardy
              dateRangeTo: timeParam && timeParam[1] || "now",
              indexPatternList,
              selectedIndexPattern: indexPattern,
              setIndexPattern,
              indices: props.indices,
              histogramData,
              timefilterUpdateHandler,
              histogramOpts: opts,
              timeSetting: {
                ...(timeChartProps || {}),
                showTimeSetting: true,
                showTimeField: true,
                timeField: indexPattern.timeFieldName,
                timeFields: props.timeFields,
                showTimeInterval: !!histogramData,
                timeInterval: timeChartProps?.stateInterval,
                timeIntervals: intervalOptions?.map(({display, val}) => ({ label: display, value: val})),
                onTimeSettingChange: ({timeField, timeInterval}) => {
                  if (indexPattern.timeFieldName !== timeField) {
                    onTimeFieldChange(indexPattern, timeField)
                  }
                  if (timeChartProps?.stateInterval !== timeInterval) {
                    onIntervalChange(timeInterval)
                  }
                },
                autoFitLoading: timeTipsLoading,
                onAutoFit: onTimeTipsSelect,
                timeZone,
                onTimeZoneChange: setTimeZone,
                recentlyUsedRanges: []
              },
            }}
          />
          <InsightBar
            ref={insightBarRef}
            loading={resultState === "loading"}
            queries={{
              clusterId: props.selectedCluster?.id,
              indexPattern: indexPattern,
              query: {
                language: "kuery",
                query: queryParam || "",
              },
              timeField: indexPattern.timeFieldName,
              timefilter,
              getFilters: () => filterManager.getFilters(),
              getBucketSize,
              columns: state.columns,
            }}
            // layoutConfig={{
            //   layout,
            //   onChange: setLayout,
            // }}
            isEmpty={resultState === "none" && queryFrom === 0}
            onQueriesSelect={onQueriesSelect}
            onQueriesRemove={(id) => {
              if (selectedQueriesId === id) {
                setSelectedQueriesId();
                setSelectedQueries();
              }
            }}
            mode={mode}
            onModeChange={setMode}
            onFullScreen={fullScreenHandle.enter}
            getVisualizations={() => visRef?.current?.getVisualizations()}
            searchInfo={{
              took,
              total: hits,
              ...timeChartProps,
            }}
            selectedQueriesId={selectedQueriesId}
            searchConfig={{
              trackTotalHits,
              timeout: timeout,
              whetherToSample,
              sampleSize,
              topNumber,
              sampleRecords
            }}
            onSearchConfigChange={(value, name) => {
              switch(name){
                case 'track_total_hits':
                  setTrackTotalHits(value);
                  break;
                case 'time_out':
                  setTimeout(value)
                  localStorage.setItem('search_time_out', value)
                  break;
                case 'whether_to_sample':
                  setWhetherToSample(value);
                  break;
                case 'sample_size':
                  setSampleSize(value);
                  break;
                case 'top_number':
                  setTopNumber(value);
                  break;
                case 'sample_records':
                  setSampleRecords(value);
                  break;
                default:
                  break;
              }
            }}
            showLayoutListIcon={false}
            // viewLayout={viewLayout}
            // onViewLayoutChange={(layout) => {
            //   if (layout) {
            //     setViewLayout(layout);
            //   } else {
            //     setViewLayout();
            //   }
            // }}
          />
        </div>

        {/* </Tabs.TabPane>
          <Tabs.TabPane key="searchflow" tab="SearchFlow">
            <TraceSearch onTraceIDSearch={onTraceIDSearch} />
          </Tabs.TabPane>
        </Tabs> */}

        <EuiPageBody
          className="dscPageBody"
          aria-describedby="savedSearchTitle"
        >
          <EuiFlexGroup className="dscPageBody__contents" gutterSize="none">
            {resultState === "none" && queryFrom === 0 ? (
              <DiscoverNoResults
                timeFieldName={opts.timefield}
                queryLanguage={state.query?.language || ""}
                onTimeTipsSelect={onTimeTipsSelect}
                timeTipsLoading={timeTipsLoading}
                // data={opts.data}
                //   error={fetchError}
              />
            ) : mode === "insight" ? (
              <Visualization
                ref={visRef}
                indexPattern={indexPattern.title}
                clusterId={props.selectedCluster?.id}
                timeField={indexPattern.timeFieldName}
                getFilters={getSearchFilters}
                getBucketSize={getBucketSize}
                fullScreenHandle={fullScreenHandle}
                // layout={layout}
                selectedQueries={selectedQueries}
              />
            ) : 
            // mode === "layout" ? (
            //   <Layout
            //     ref={layoutRef}
            //     clusterId={props.selectedCluster?.id}
            //     indexPattern={indexPattern}
            //     timeRange={timefilter?.getTime()}
            //     query={getSearchFilters()}
            //     layout={viewLayout}
            //     fullScreenHandle={fullScreenHandle}
            //   />
            // ) : 
            (
              <>
                {indexPattern && (
                  <EuiFlexItem grow={false}>
                    <SidebarMemoized
                      config={{}}
                      columns={columns}
                      fieldCounts={fieldCounts}
                      hits={records}
                      indexPatternList={indexPatternList}
                      indexPatterns={indexPatterns}
                      onAddField={onAddColumn}
                      onAddFilter={onAddFilter}
                      onRemoveField={onRemoveColumn}
                      selectedIndexPattern={indexPattern}
                      setIndexPattern={setIndexPattern}
                      setAppState={setState}
                      state={state}
                      isClosed={isSidebarClosed}
                      //unmappedFieldsConfig={unmappedFieldsConfig}
                      //useNewFieldsApi={useNewFieldsApi}
                      indices={props.indices}
                      distinctParams={distinctParams}
                      onDistinctParamsChange={onDistinctParamsChange}
                      total={hits}
                      onFieldAgg={onFieldAgg}
                      whetherToSample={whetherToSample}
                      sampleSize={sampleSize}
                      topNumber={topNumber}
                    />
                  </EuiFlexItem>
                )}
                <EuiHideFor sizes={["xs", "s"]}>
                  <EuiFlexItem grow={false}>
                    <EuiButtonIcon
                      iconType={isSidebarClosed ? "menuRight" : "menuLeft"}
                      iconSize="m"
                      size="s"
                      onClick={() => {
                        setIsSidebarClosed(!isSidebarClosed);
                        setTimeout(() => {
                          window.dispatchEvent(new Event("resize"));
                        }, 50);
                      }}
                      data-test-subj="collapseSideBarButton"
                      aria-controls="discover-sidebar"
                      aria-expanded={isSidebarClosed ? "false" : "true"}
                      aria-label={"Toggle sidebar"}
                      buttonRef={collapseIcon}
                    />
                  </EuiFlexItem>
                </EuiHideFor>
                {(resultState !== "none" || queryFrom > 0) && (
                  <EuiFlexItem
                    className="dscPageContent__wrapper"
                    style={{ overflow: "hidden" }}
                  >
                    {
                      <EuiPageContent
                        // verticalPosition={resultState == 'loading' ? 'center' : undefined}
                        // horizontalPosition={resultState == 'loading' ? 'center' : undefined}
                        paddingSize="none"
                        className={classNames("dscPageContent", {
                          "dscPageContent--centered": contentCentered,
                        })}
                      >
                        <div
                          style={{
                            display: resultState !== "loading" ? "none" : "",
                          }}
                        >
                          <div className="dscOverlay">
                            <LoadingSpinner />
                          </div>
                        </div>
                        {/* {resultState === 'loading' && <LoadingSpinner />} */}
                        {traceAgg.length > 0 ? (
                          <TraceChart
                            data={traceAgg}
                            toogleFilter={toggleFilter}
                          />
                        ) : null}
                        {
                          <EuiFlexGroup
                            className="dscPageContent__inner"
                            direction="column"
                            alignItems="stretch"
                            gutterSize="none"
                            responsive={false}
                            style={{ position: "relative" }}
                          >
                            <EuiFlexItem className="eui-yScroll">
                              <section
                                className="dscTable eui-yScroll"
                                aria-labelledby="documentsAriaLabel"
                                ref={scrollableDesktop}
                                tabIndex={-1}
                              >
                                <h2
                                  className="euiScreenReaderOnly"
                                  id="documentsAriaLabel"
                                >
                                  Documents
                                </h2>

                                {records && records.length > 0 ? (
                                  <div className="dscDiscoverGrid">
                                    <Table
                                      columns={columns}
                                      sortOrder={state.sort || []}
                                      indexPattern={indexPattern}
                                      onFilter={onAddFilter}
                                      onRemoveColumn={onRemoveColumn}
                                      onMoveColumn={onMoveColumn}
                                      onAddColumn={onAddColumn}
                                      onChangeSortOrder={onSort}
                                      document={document}
                                      hits={records}
                                      hitsTotal={hits}
                                      queryFrom={queryFrom}
                                      setQueryFrom={setQueryFrom}
                                    />
                                  </div>
                                ) : null}
                              </section>
                            </EuiFlexItem>
                          </EuiFlexGroup>
                        }
                      </EuiPageContent>
                    }
                  </EuiFlexItem>
                )}
              </>
            )}
          </EuiFlexGroup>
        </EuiPageBody>
      </Card>
    </div>
  );
};

const DiscoverUI = (props) => {
  if (!props.selectedCluster?.id) {
    return null;
  }
  const [loading, setLoading] = useState(false);
  const [viewID, setViewID] = useQueryParam("viewID", StringParam);
  const [index, setIndex] = useQueryParam("index", StringParam);
  // const [type, setType] = useQueryParam('type', StringParam);
  const [queryParam, setQueryParam] = useQueryParam("query", StringParam);
  const [state, setState] = useState({
    indices: [],
    timeFields: [],
  });
  useMemo(() => {
    const { http } = getContext();
    http.getServerBasePath = () => {
      return `${ESPrefix}/` + props.selectedCluster?.id;
    };
  }, [props.selectedCluster]);

  const getTimeFields = (IP) => {
    const timeFields = [];
    IP.fields.forEach((field) => {
      if (field.spec.type == "date") {
        timeFields.push(field.displayName);
      }
    });
    return timeFields;
  };
  useEffect(() => {
    if (queryParam) {
      queryStringManager.setQuery({
        query: queryParam,
        language: "kuery",
      });
    }
    const { http } = getContext();
    const initialFetch = async () => {
      setState({
        indices: [],
        timeFields: [],
      })
      setLoading(true)
      const indices = await http.fetch(
        http.getServerBasePath() + `/internal/view-management/resolve_index/*`,
        {
          query: { expand_wildcards: "all" },
        }
      );

      if (indices.error) {
        return false;
      }
      const indexNames = [];

      Object.keys(indices).forEach((key) =>
        indices[key].map((item) => indexNames.push(item.name))
      );

      try {
        const ils = await services.savedObjects.savedObjectsClient.find({
          type: "view",
          fields: ["title"],
          search: "",
          searchFields: ["title"],
          perPage: 10000,
        });

        if (ils.length === 0 && indexNames.length === 0) {
          // props.history.push("/data/views/");
          setLoading(false)
          return;
        }
        let defaultIndex = viewID;
        let defaultIP = null;
        if (indexNames.includes(index)) {
          defaultIP = await services.indexPatternService.get(
            index,
            "index",
            props.selectedCluster?.id
          );
        } else {
          if (ils.length > 0) {
            defaultIndex =
              viewID ||
              (await http.fetch(
                http.getServerBasePath() + "/setting/defaultIndex"
              ));
            let targetIndex = ils.filter((il) => il.id == defaultIndex);
            defaultIP = await services.indexPatternService.get(
              targetIndex.length > 0 ? defaultIndex : ils[0]?.id
            );
            if (targetIndex.length === 0) {
              setViewID(ils[0]?.id);
            }
          } else {
            let targetIndex =
              indexNames.find((indexName) => !indexName.startsWith(".")) ||
              indexNames[0];
            defaultIP = await services.indexPatternService.get(
              targetIndex,
              "index",
              props.selectedCluster?.id
            );
            setIndex(targetIndex);
          }
        }
        const timeFields = getTimeFields(defaultIP);
        if (
          timeFields &&
          timeFields.length == 1 &&
          defaultIP.timeFieldName == ""
        ) {
          defaultIP.timeFieldName = timeFields[0];
        }
        setState({
          indexPatternList: ils,
          indexPattern: defaultIP,
          indices: indexNames,
          timeFields,
        });
      } catch (err) {
        setLoading(false)
        console.log(err);
      }
      setLoading(false)
      // if (!viewID) {
      //   setViewID(defaultIP.id);
      // }
    };
    initialFetch();

    // return ()=>{
    //   queryStringManager.setQuery('');
    // }
  }, [props.selectedCluster]);

  useEffect(() => {
    return () => {
      queryStringManager.setQuery({
        query: "",
        language: "kuery",
      });
      filterManager.removeAll();
    };
  }, []);

  const changeIndexPattern = React.useCallback(
    (indexPattern) => {
      const timeFields = getTimeFields(indexPattern);
      if (
        timeFields &&
        timeFields.length == 1 &&
        indexPattern.timeFieldName == ""
      ) {
        indexPattern.timeFieldName = timeFields[0];
      }
      setState({
        ...state,
        indexPattern,
        timeFields,
      });
      if (indexPattern.type == "index") {
        setIndex(indexPattern.id);
        setViewID(undefined);
      } else {
        setViewID(indexPattern.id);
        setIndex(undefined);
      }
    },
    [state]
  );
  const loadingUI = (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <Spin tip="Initializing ......" />
    </div>
  )

  if (loading) return loadingUI

  if ((state.indexPatternList || [])?.length === 0 && state.indices?.length === 0 ) {
    return (
      <Card
        bordered={false}
        bodyStyle={{ paddingTop: 10, height: 'calc(100vh - 170px)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
      >
        <Empty 
          description={
            <span>
              The current cluster has no indices or views
            </span>
          }
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          {hasAuthority("data.index:all") && (
            <Link to={"/data/index"}>
              <Button type="primary">Create Now</Button>
            </Link> 
          )}
        </Empty>
      </Card>
    )
  }

  return (state.indexPatternList && state.indexPatternList.length > 0) ||
    state.indices.length > 0 ? (
    <Discover {...props} {...state} changeIndexPattern={changeIndexPattern} />
  ) : loadingUI;
};

const DiscoverContainer = (props) => {
  if (!props.selectedCluster?.id) {
    return <Card ><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /></Card>;
  }
  return (
    <QueryParamProvider ReactRouterRoute={Route}>
      <DiscoverUI {...props} />
    </QueryParamProvider>
  );
};

export default connect(({ global }) => ({
  selectedCluster: global.selectedCluster,
}))(DiscoverContainer);
