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
} from "antd";
// import DiscoverGrid from './Components/discover_grid';
import { flattenHitWrapper } from "../../components/kibana/data/common/index_patterns/index_patterns";
import { getStateColumnActions } from "../../components/kibana/discover/public/application/angular/doc_table/actions/columns";
import { DiscoverSidebar } from "../../components/kibana/discover/public/application/components/sidebar/discover_sidebar";
import { HitsCounter } from "../../components/kibana/discover/public/application/components/hits_counter";
import { TimechartHeader } from "../../components/kibana/discover/public/application/components/timechart_header";
import { DiscoverHistogram } from "../../components/kibana/discover/public/application/components/histogram/histogram";
import moment from "moment";
import { getContext } from "./context";
import { createSearchBar } from "../../components/kibana/data/public/ui/search_bar/create_search_bar";
import { LoadingSpinner } from "../../components/kibana/discover/public/application/components/loading_spinner/loading_spinner";
import { DiscoverNoResults } from "../../components/kibana/discover/public/application/angular/directives/no_results";
import { buildPointSeriesData } from "../../components/kibana/discover/public/application/angular/helpers/";
import { generateFilters } from "../../components/kibana/data/public/query/filter_manager/lib/generate_filters";
import Table from "../../components/kibana/discover/public/application/components/discover_table/table";
import { SettingContent } from "./SettingContent";
import TimeFieldExampleImage from "@/assets/time_field_exmaple.jpg";

import {
  useQueryParam,
  StringParam,
  QueryParamProvider,
  ArrayParam,
} from "use-query-params";
import { Route } from "umi";
import { ESPrefix } from "@/services/common";

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

const Discover = (props) => {
  const [columnsParam, setColumnsParam] = useQueryParam("columns", ArrayParam);
  const [queryParam, setQueryParam] = useQueryParam("query", StringParam);

  //const indexPatternList = [{"type":"index-pattern","id":"c7fbafd0-34a9-11eb-925f-9db57376c4ce","attributes":{"title":".monitoring-es-7-mb-*"},"references":[],"migrationVersion":{"index-pattern":"7.6.0"},"updated_at":"2020-12-02T14:34:38.010Z","version":"WzgyNCw3XQ==","namespaces":["default"],"score":0},{"type":"index-pattern","id":"861ea7f0-3a9b-11eb-9b55-45d33507027a","attributes":{"title":"mock_log*"},"references":[],"migrationVersion":{"index-pattern":"7.6.0"},"updated_at":"2020-12-10T04:09:09.044Z","version":"WzE3NTgsMTBd","namespaces":["default"],"score":0},{"type":"index-pattern","id":"1a28c950-0f6b-11eb-9512-2d0c0eda237d","attributes":{"title":"gateway_requests*"},"references":[],"migrationVersion":{"index-pattern":"7.6.0"},"updated_at":"2021-05-22T11:04:23.811Z","version":"WzkxMTgsNDhd","namespaces":["default"],"score":0},{"type":"index-pattern","id":"1ccce5c0-bb9a-11eb-957b-939add21a246","attributes":{"title":"test-custom*"},"references":[],"migrationVersion":{"index-pattern":"7.6.0"},"updated_at":"2021-05-23T07:40:14.747Z","version":"WzkxOTEsNDhd","namespaces":["default"],"score":0}];
  const [state, setState] = useState({
    columns: columnsParam || ["_source"], //['name', 'address'],
    interval: "auto",
    activeTabKey: "normal",
  });
  const [searchType, setSearchType] = React.useState("normal");

  // const [sort, setSort] = useState(null);

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
  const setIndexPattern = async (id, typ, filters, isReset = false) => {
    const IP = await services.indexPatternService.get(
      id,
      typ,
      props.selectedCluster.id
    );
    subscriptions.unsubscribe();
    props.changeIndexPattern(IP);
    setState({
      ...state,
      columns: ["_source"],
      sort: [],
    });
    if (filters && filters.length > 0) {
      if (isReset) {
        filterManager.setFilters(filters);
      } else {
        filterManager.addFilters(filters);
      }
    }
    updateQuery();
  };
  const onTimeFieldChange = async (id, timeField) => {
    const IP = await services.indexPatternService.get(
      id,
      "index",
      props.selectedCluster.id
    );
    IP.timeFieldName = timeField;
    props.changeIndexPattern(IP);
    updateQuery();
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

  const columns = state.columns;

  const updateQuery = useCallback(
    async (_payload) => {
      if (!indexPatternRef.current) {
        return;
      }
      setResultState("loading");
      const params = getSearchParams(
        _payload?.indexPattern || indexPatternRef.current,
        _payload?.interval || state.interval,
        _payload?.sort
      );
      const res = await fetchESRequest(params, props.selectedCluster.id);
      if (!res.hits.hits) {
        res.hits.hits = [];
      }
      setSearchRes(res);
      const { query } = queryStringManager.getQuery();
      if (query != queryParam) {
        setQueryParam(query);
      }
      // let filters = filterManager.getFilters();
      // const tfilter = timefilter.createFilter(indexPattern);
      // filters = [...filterManager.getFilters(), ...(tfilter ? [tfilter] : [])],

      // console.log(filters)
      // console.log(res)
      //console.log(JSON.stringify(params));
      // console.log(getEsQuery(indexPattern));
      // console.log(timefilter.createFilter(indexPattern));
    },
    [state.interval]
  );

  const onChangeInterval = useCallback(
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
    aggregations: { "2": { buckets: [] } },
  });

  const [resultState, setResultState] = useState("loading");
  const { histogramData, timeChartProps } = useMemo(() => {
    if (!searchRes.hits.hits || searchRes.hits.hits.length == 0) {
      setResultState("none");
      return {};
    }
    if (!indexPattern.timeFieldName || !searchRes.aggregations) {
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

    aggregations["2"].buckets.forEach((bk) => {
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
      stateInterval: state.interval || interval.esUnit,
      options: intervalOptions,
      onChangeInterval: onChangeInterval, //(interval)=>{console.log(interval)},
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
  }, [searchRes, indexPattern, indexPattern.timeFieldName]);

  const setAppState = (newState) => {
    if (
      state.columns[0] === "_source" ||
      newState.columns[0] === "_source" ||
      state.columns.length != newState.columns.length
    ) {
      setColumnsParam(newState.columns);
    }
    setState(newState);
  };

  const { onAddColumn, onRemoveColumn, onMoveColumn, onSetColumns } = useMemo(
    () =>
      getStateColumnActions({
        indexPattern,
        indexPatterns: [indexPattern],
        setAppState: setAppState,
        state,
        useNewFieldsApi: false,
      }),
    [indexPattern, state]
  );

  const collapseIcon = useRef(null);
  const toggleHideChart = useCallback(() => {
    const newState = { ...state, hideChart: !state.hideChart };
    setState(newState);
  }, [state]);
  const hideChart = useMemo(() => state.hideChart, [state]);
  const [isSidebarClosed, setIsSidebarClosed] = useState(false);
  const useNewFieldsApi = false;

  const onSort = useCallback(
    (nsort) => {
      setState({ ...state, sort: nsort });
      updateQuery({ sort: nsort });
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
    [indexPattern]
  );

  const timefilterUpdateHandler = useCallback(
    (ranges) => {
      //console.log(ranges)
      timefilter.setTime({
        from: moment(ranges.from).toISOString(),
        to: moment(ranges.to).toISOString(),
        mode: "absolute",
      });
    },
    [timefilter]
  );
  const rows = searchRes.hits.hits;

  const opts = {
    savedSearch: {},
    timefield: indexPattern?.getTimeField()?.displayName,
    chartAggConfigs: {},
  };
  const fieldCounts = {};
  for (const hit of rows) {
    for (const key of Object.keys(indexPattern.flattenHit(hit, true))) {
      fieldCounts[key] = (fieldCounts[key] || 0) + 1;
    }
  }
  const hits = searchRes.hits.total?.value || searchRes.hits.total;
  const resetQuery = () => {};
  const showDatePicker = indexPattern.timeFieldName != "";

  const saveDocument = useCallback(
    async ({ _index, _id, _type, _source, is_new }) => {
      const { http } = getContext();
      const res = await http.put(
        `/elasticsearch/${props.selectedCluster.id}/doc/${_index}/${_id}`,
        {
          prependBasePath: false,
          query: {
            _type,
            is_new,
          },
          body: JSON.stringify(_source),
        }
      );
      if (res.error) {
        message.error(res.error);
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
        `/elasticsearch/${props.selectedCluster.id}/doc/${_index}/${_id}`,
        {
          prependBasePath: false,
          query: {
            _type,
          },
        }
      );
      if (res.error) {
        message.error(res.error);
        return res;
      }
      message.success("deleted successfully");
      updateQuery();
      return res;
    },
    [props.selectedCluster, updateQuery]
  );
  const document = useMemo(() => {
    saveDocument, deleteDocument;
  }, [saveDocument, deleteDocument]);

  const [settingsVisible, setSettingsVisible] = React.useState(false);
  const onTraceIDSearch = React.useCallback(
    async (value) => {
      const { http } = getContext();
      const indexNames = await http
        .fetch(http.getServerBasePath() + "/search/trace_id", {
          query: {
            traceID: value,
          },
        })
        .catch((err) => {
          console.log(err);
        });
      if (indexNames && indexNames.length > 0) {
        const newFilters = generateFilters(
          filterManager,
          "trace_id",
          value,
          "+",
          indexNames.join(",")
        );
        setIndexPattern(indexNames.join(","), "index", newFilters, true);
        setSearchType("normal");
      }
    },
    [setIndexPattern]
  );

  return (
    <Card bordered={false} bodyStyle={{ paddingTop: 10 }}>
      <Tabs
        animated={false}
        tabPosition="right"
        activeKey={searchType}
        onChange={setSearchType}
        type="card"
      >
        <Tabs.TabPane key="normal" tab="Normal">
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
            }}
          />
        </Tabs.TabPane>
        <Tabs.TabPane key="traceid" tab="TraceID">
          <Input.Search
            placeholder="Input trace ID"
            enterButton={
              <Button icon="search" type="primary">
                搜索
              </Button>
            }
            size="large"
            onSearch={onTraceIDSearch}
          />
        </Tabs.TabPane>
      </Tabs>

      <EuiPageBody className="dscPageBody" aria-describedby="savedSearchTitle">
        <EuiFlexGroup className="dscPageBody__contents" gutterSize="none">
          {indexPattern && (
            <EuiFlexItem grow={false}>
              <SidebarMemoized
                config={{}}
                columns={columns}
                fieldCounts={fieldCounts}
                hits={rows}
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
          {resultState === "none" && (
            <DiscoverNoResults
              timeFieldName={opts.timefield}
              queryLanguage={state.query?.language || ""}
              // data={opts.data}
              //   error={fetchError}
            />
          )}
          {resultState !== "none" && (
            <EuiFlexItem
              className="dscPageContent__wrapper"
              style={{ overflow: "hidden" }}
            >
              <EuiPageContent
                // verticalPosition={resultState == 'loading' ? 'center' : undefined}
                // horizontalPosition={resultState == 'loading' ? 'center' : undefined}
                paddingSize="none"
                className={classNames("dscPageContent", {
                  "dscPageContent--centered": contentCentered,
                })}
              >
                {/* todo add settings icon */}
                {props.timeFields.length > 0 && (
                  <div
                    className="dscSetting setting-icon"
                    onClick={() => {
                      setSettingsVisible(!settingsVisible);
                    }}
                  >
                    <Icon type="setting" />
                  </div>
                )}
                {settingsVisible ? (
                  <SettingContent
                    {...timeChartProps}
                    indexPattern={indexPattern}
                    timeFields={props.timeFields}
                    onVisibleChange={(visible) => {
                      setSettingsVisible(visible);
                    }}
                    onTimeFieldChange={onTimeFieldChange}
                  />
                ) : null}
                <div
                  style={{ display: resultState !== "loading" ? "none" : "" }}
                >
                  <div className="dscOverlay">
                    <LoadingSpinner />
                  </div>
                </div>
                {/* {resultState === 'loading' && <LoadingSpinner />} */}
                {
                  <EuiFlexGroup
                    className="dscPageContent__inner"
                    direction="column"
                    alignItems="stretch"
                    gutterSize="none"
                    responsive={false}
                  >
                    {hits > 0 && (
                      <EuiFlexItem grow={false} className="dscResultCount">
                        {/* <EuiFlexGroup
                          alignItems="center"
                          justifyContent="spaceBetween"
                        >
                          <EuiFlexItem
                            grow={false}
                            className="dscResuntCount__title eui-textTruncate eui-textNoWrap"
                            style={{ width: "100%" }}
                          >
                            <HitsCounter
                              hits={hits > 0 ? hits : 0}
                              showResetButton={
                                !!(opts.savedSearch && opts.savedSearch.id)
                              }
                              onResetQuery={resetQuery}
                            />
                          </EuiFlexItem>
                        </EuiFlexGroup> */}

                        <div
                          style={{
                            marginTop: 10,
                            marginBottom: 10,
                            textAlign: "center",
                          }}
                        >
                          <TimechartHeader
                            hits={hits > 0 ? hits : 0}
                            dateFormat={"YYYY-MM-DD H:mm"}
                            {...timeChartProps}
                          />
                        </div>
                        {props.timeFields.length > 0 &&
                          indexPattern.timeFieldName == "" && (
                            <div className="fake-chart">
                              <div className="fake-mask">
                                Click the button of right corner to select a
                                time field
                              </div>
                              <img
                                src={TimeFieldExampleImage}
                                style={{ width: "100%" }}
                              />
                            </div>
                          )}
                      </EuiFlexItem>
                    )}
                    {!hideChart && opts.timefield && (
                      <EuiFlexItem>
                        <section
                          aria-label={"Histogram of found documents"}
                          className="dscTimechart"
                        >
                          {opts.chartAggConfigs &&
                            histogramData &&
                            rows.length !== 0 && (
                              <div
                                className="dscHistogramGrid"
                                data-test-subj="discoverChart"
                              >
                                <DiscoverHistogram
                                  chartData={histogramData}
                                  timefilterUpdateHandler={
                                    timefilterUpdateHandler
                                  }
                                />
                              </div>
                            )}
                        </section>
                        <EuiSpacer size="s" />
                      </EuiFlexItem>
                    )}

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

                        {rows && rows.length > 0 ? (
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
                              hits={rows}
                            />
                          </div>
                        ) : null}
                      </section>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                }
              </EuiPageContent>
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
      </EuiPageBody>
    </Card>
  );
};

const DiscoverUI = (props) => {
  if (!props.selectedCluster.id) {
    return null;
  }
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
      return `${ESPrefix}/` + props.selectedCluster.id;
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
      const indices = await http.fetch(
        http.getServerBasePath() + "/_cat/indices"
      );
      const indexNames = Object.keys(indices); //.filter(key=>!key.startsWith("."));
      const ils = await services.savedObjects.savedObjectsClient.find({
        type: "view",
        fields: ["title"],
        search: "",
        searchFields: ["title"],
        perPage: 100,
      });

      if (ils.length === 0 && indexNames.length === 0) {
        props.history.push("/data/views/");
        return;
      }
      let defaultIndex = viewID;
      let defaultIP = null;
      if (indexNames.includes(index)) {
        defaultIP = await services.indexPatternService.get(
          index,
          "index",
          props.selectedCluster.id
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
          defaultIP = await services.indexPatternService.get(
            indexNames[0],
            "index",
            props.selectedCluster.id
          );
          setIndex(indexNames[0]);
        }
      }
      const timeFields = getTimeFields(defaultIP);
      setState({
        indexPatternList: ils,
        indexPattern: defaultIP,
        indices: indexNames,
        timeFields,
      });
      // if (!viewID) {
      //   setViewID(defaultIP.id);
      // }
    };
    initialFetch();
    // return ()=>{
    //   queryStringManager.setQuery('');
    // }
  }, [props.selectedCluster]);

  const changeIndexPattern = React.useCallback(
    (indexPattern) => {
      const timeFields = getTimeFields(indexPattern);
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

  return (state.indexPatternList && state.indexPatternList.length > 0) ||
    state.indices.length > 0 ? (
    <Discover {...props} {...state} changeIndexPattern={changeIndexPattern} />
  ) : (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <Spin tip="正在初始化 ......" />
    </div>
  );
};

const DiscoverContainer = (props) => {
  if (props.selectedCluster.id == "") {
    return null;
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
