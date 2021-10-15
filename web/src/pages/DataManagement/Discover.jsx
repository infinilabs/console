import React, {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
  createContext,
  useContext,
  useRef,
} from 'react';
import classNames from 'classnames';

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
} from '@elastic/eui';
import '@elastic/eui/dist/eui_theme_amsterdam_light.css';
import * as styles from './discover.scss';
import { Subscription } from 'rxjs';
import { connect } from 'dva';

import { Card, Spin, message } from 'antd';
// import DiscoverGrid from './Components/discover_grid';
import {flattenHitWrapper} from '../../components/kibana/data/common/index_patterns/index_patterns';
import {getStateColumnActions} from '../../components/kibana/discover/public/application/angular/doc_table/actions/columns';
import { DiscoverSidebar } from '../../components/kibana/discover/public/application/components/sidebar/discover_sidebar';
import {HitsCounter } from '../../components/kibana/discover/public/application/components/hits_counter';
import {TimechartHeader } from '../../components/kibana/discover/public/application/components/timechart_header';
import {DiscoverHistogram} from '../../components/kibana/discover/public/application/components/histogram/histogram';
import moment from 'moment';
import {getContext} from './context';
import {createSearchBar} from '../../components/kibana/data/public/ui/search_bar/create_search_bar';
import { LoadingSpinner } from '../../components/kibana/discover/public/application/components/loading_spinner/loading_spinner';
import { DiscoverNoResults } from '../../components/kibana/discover/public/application/angular/directives/no_results';
import { buildPointSeriesData } from '../../components/kibana/discover/public/application/angular/helpers/';
import {generateFilters} from '../../components/kibana/data/public/query/filter_manager/lib/generate_filters';
import Table from '../../components/kibana/discover/public/application/components/discover_table/table';

import {useQueryParam, StringParam, QueryParamProvider, ArrayParam} from 'use-query-params';
import {Route} from 'umi'
 
const SidebarMemoized = React.memo(DiscoverSidebar);

const {filterManager, queryStringManager, timefilter, storage, getEsQuery, getSearchParams, 
  intervalOptions, getTimeBuckets, fetchESRequest, services} = getContext();

const SearchBar = createSearchBar();


const Discover = (props)=>{

  const [columnsParam, setColumnsParam] = useQueryParam('columns', ArrayParam);
  const [queryParam, setQueryParam] = useQueryParam('query', StringParam);
  
   //const indexPatternList = [{"type":"index-pattern","id":"c7fbafd0-34a9-11eb-925f-9db57376c4ce","attributes":{"title":".monitoring-es-7-mb-*"},"references":[],"migrationVersion":{"index-pattern":"7.6.0"},"updated_at":"2020-12-02T14:34:38.010Z","version":"WzgyNCw3XQ==","namespaces":["default"],"score":0},{"type":"index-pattern","id":"861ea7f0-3a9b-11eb-9b55-45d33507027a","attributes":{"title":"mock_log*"},"references":[],"migrationVersion":{"index-pattern":"7.6.0"},"updated_at":"2020-12-10T04:09:09.044Z","version":"WzE3NTgsMTBd","namespaces":["default"],"score":0},{"type":"index-pattern","id":"1a28c950-0f6b-11eb-9512-2d0c0eda237d","attributes":{"title":"gateway_requests*"},"references":[],"migrationVersion":{"index-pattern":"7.6.0"},"updated_at":"2021-05-22T11:04:23.811Z","version":"WzkxMTgsNDhd","namespaces":["default"],"score":0},{"type":"index-pattern","id":"1ccce5c0-bb9a-11eb-957b-939add21a246","attributes":{"title":"test-custom*"},"references":[],"migrationVersion":{"index-pattern":"7.6.0"},"updated_at":"2021-05-23T07:40:14.747Z","version":"WzkxOTEsNDhd","namespaces":["default"],"score":0}];
  const [state, setState] = useState({
    columns: columnsParam||['_source'],//['name', 'address'],
    interval: 'auto',
  }); 


  // const [sort, setSort] = useState(null);

  const subscriptions = useMemo(()=>{
    const subscriptions = new Subscription();
    subscriptions.add(
      timefilter.getAutoRefreshFetch$().subscribe({
        next: () => {
          updateQuery();
        },
      })
    );
    return subscriptions;
  },[props.indexPattern]);
   const setIndexPattern = async (id)=>{
      const IP = await services.indexPatternService.get(id);
      subscriptions.unsubscribe();
      props.changeIndexPattern(IP);
      setState({
        ...state,
        columns: ['_source'],
        sort: [],
      })
   }
 
   //const indexPatterns = [{"id":"1ccce5c0-bb9a-11eb-957b-939add21a246","type":"index-pattern","namespaces":["default"],"updated_at":"2021-05-23T07:40:14.747Z","version":"WzkxOTEsNDhd","attributes":{"title":"test-custom*","timeFieldName":"created_at","fields":"[{\"count\":0,\"name\":\"_id\",\"type\":\"string\",\"esTypes\":[\"_id\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":false},{\"count\":0,\"name\":\"_index\",\"type\":\"string\",\"esTypes\":[\"_index\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":false},{\"count\":0,\"name\":\"_score\",\"type\":\"number\",\"scripted\":false,\"searchable\":false,\"aggregatable\":false,\"readFromDocValues\":false},{\"count\":0,\"name\":\"_source\",\"type\":\"_source\",\"esTypes\":[\"_source\"],\"scripted\":false,\"searchable\":false,\"aggregatable\":false,\"readFromDocValues\":false},{\"count\":0,\"name\":\"_type\",\"type\":\"string\",\"esTypes\":[\"_type\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":false},{\"count\":0,\"name\":\"address\",\"type\":\"string\",\"esTypes\":[\"text\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":false,\"readFromDocValues\":false},{\"count\":0,\"name\":\"address.keyword\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true,\"subType\":{\"multi\":{\"parent\":\"address\"}}},{\"count\":0,\"conflictDescriptions\":{\"text\":[\"test-custom1\"],\"long\":[\"test-custom\",\"test-custom8\",\"test-custom9\"]},\"name\":\"age\",\"type\":\"conflict\",\"esTypes\":[\"text\",\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":false},{\"count\":0,\"name\":\"age.keyword\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true,\"subType\":{\"multi\":{\"parent\":\"age\"}}},{\"count\":0,\"name\":\"created_at\",\"type\":\"date\",\"esTypes\":[\"date\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"email\",\"type\":\"string\",\"esTypes\":[\"text\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":false,\"readFromDocValues\":false},{\"count\":0,\"name\":\"email.keyword\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true,\"subType\":{\"multi\":{\"parent\":\"email\"}}},{\"count\":0,\"name\":\"hobbies\",\"type\":\"string\",\"esTypes\":[\"text\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":false,\"readFromDocValues\":false},{\"count\":0,\"name\":\"hobbies.keyword\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true,\"subType\":{\"multi\":{\"parent\":\"hobbies\"}}},{\"count\":0,\"name\":\"id\",\"type\":\"string\",\"esTypes\":[\"text\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":false,\"readFromDocValues\":false},{\"count\":0,\"name\":\"id.keyword\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true,\"subType\":{\"multi\":{\"parent\":\"id\"}}},{\"count\":0,\"name\":\"name\",\"type\":\"string\",\"esTypes\":[\"text\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":false,\"readFromDocValues\":false},{\"count\":0,\"name\":\"name.keyword\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true,\"subType\":{\"multi\":{\"parent\":\"name\"}}}]"},"references":[],"migrationVersion":{"index-pattern":"7.6.0"}}];
   const indexPattern = props.indexPattern;
   const indexPatterns = [indexPattern];
   const indexPatternList = props.indexPatternList
   const contentCentered = false; //resultState != 'ready';

   indexPatterns.get = (id)=>{
     return Promise.resolve(indexPatterns.find(ip=>ip.id==id));
   }
   getContext().setIndexPatterns(indexPatterns)
  
  const [expandedDoc, setExpandedDoc] = useState(undefined);
  const scrollableDesktop = useRef(null);
  
  const columns = state.columns;

  const updateQuery = useCallback(
    async (_payload) => {
      if(!indexPattern){
        return
      }
      setResultState('loading');
      const params = getSearchParams(_payload?.indexPattern || indexPattern, _payload?.interval || state.interval, _payload?.sort);
      const res = await fetchESRequest(params, props.selectedCluster.id)
      if(!res.hits.hits){
        res.hits.hits=[];
      }
      setSearchRes(res);
      const {query} = queryStringManager.getQuery();
      if(query != queryParam){
        setQueryParam(query);
      }
      // let filters = filterManager.getFilters();
      // const tfilter = timefilter.createFilter(indexPattern);
      // filters = [...filterManager.getFilters(), ...(tfilter ? [tfilter] : [])],
      
      // console.log(filters)
      // console.log(res)
      //console.log(JSON.stringify(params));
      //console.log(getEsQuery(indexPattern))
    },
    [indexPattern, state.interval,]
  );

  const onChangeInterval = useCallback(
    (interval) => {
      if (interval) {
        //console.log(calculateInterval(interval))
        setState({...state, interval });
      }
    },
    [setState, indexPattern]
  );

  const [searchRes, setSearchRes] = useState(
    {"took":11,"timed_out":false,"_shards":{"total":4,"successful":4,"skipped":3,"failed":0},"hits":{"total":0,"max_score":null,"hits":[]},"aggregations":{"2":{"buckets":[]}}}
  );

  
  const [resultState, setResultState] = useState('loading');
  const {histogramData, timeChartProps} = useMemo(()=>{
    if(!searchRes.hits.hits || searchRes.hits.hits.length == 0){
      setResultState('none');
      return {};
    }
    if(!indexPattern.timeFieldName || !searchRes.aggregations){
      setResultState('ready');
      return {histogramData:null, timeChartProps:null}
    }
    const buckets = getTimeBuckets(state.interval);
    const interval = buckets.getInterval(true);
    const chartTable = {
      columns: [{id:"key", name: `${indexPattern?.getTimeField().displayName} per ${interval.description}`},{id:"doc_count", name:"count"}],
      rows: [],
    };
    let aggregations = searchRes.aggregations;
   
    aggregations["2"].buckets.forEach((bk)=>{
      chartTable.rows.push(bk);
    })
    
    //console.log(interval, moment.duration('1', 'd'))
    const dimensions = {
      x: {
        accessor: 0,
        format: {
          id: 'date',
          params: {
            pattern: buckets.getScaledDateFormat(),
            //pattern: 'YYYY-MM-DD',
          },
        },
        params: {
          date: true,
          interval:  moment.duration(interval.esValue, interval.esUnit),
          intervalESValue: interval.esValue,
          intervalESUnit: interval.esUnit,
          bounds: buckets.getBounds(),
        },
      },
      y: {
        accessor: 1,
        format: {
          id: 'number',
        },
        label: 'Count',
      }
    };
    setResultState('ready');
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
        ...interval
      },
    }
    const histogramData = buildPointSeriesData(chartTable, dimensions);
    return {histogramData, timeChartProps}
  }, [searchRes, indexPattern])

  const setAppState = (newState)=>{
    if(state.columns[0] === '_source' || newState.columns[0] === '_source' || (state.columns.length != newState.columns.length)){
      setColumnsParam(newState.columns);
    }
    setState(newState)
  }
  
  const { onAddColumn, onRemoveColumn, onMoveColumn, onSetColumns } = useMemo(
    () =>
      getStateColumnActions({
        indexPattern,
        indexPatterns:[indexPattern],
        setAppState: setAppState,
        state,
        useNewFieldsApi:false,
      }),
    [indexPattern,state]
  );

  const collapseIcon = useRef(null);
  const toggleHideChart = useCallback(() => {
    const newState = { ...state, hideChart: !state.hideChart };
    setState(newState);
  }, [state]);
  const hideChart = useMemo(() => state.hideChart, [state]);
  const [isSidebarClosed, setIsSidebarClosed] = useState(false);
  const useNewFieldsApi = false
  
  const onSort = useCallback(
    (nsort) => {
      setState({...state, sort: nsort})
      updateQuery({sort: nsort});
    },[state, indexPattern]
  );

  const onAddFilter = useCallback(
    (field, values, operation) => {
      const fieldName = typeof field === 'string' ? field : field.name;
      const newFilters = generateFilters(
        filterManager,
        field,
        values,
        operation,
        String(indexPattern.id)
      );
      filterManager.addFilters(newFilters);
      updateQuery()
    },
    [indexPattern]
  );

  const timefilterUpdateHandler = useCallback(
    (ranges) => {
      //console.log(ranges)
      timefilter.setTime({
        from: moment(ranges.from).toISOString(),
        to: moment(ranges.to).toISOString(),
        mode: 'absolute',
      });
    },
    [timefilter]
  );
    const rows = searchRes.hits.hits;
   

    const opts = {
      savedSearch:{},
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
    const resetQuery = ()=>{};
    const showDatePicker = indexPattern.timeFieldName != "";

    const saveDocument = useCallback(async ({_index, _id, _type, _source, is_new})=>{
      const {http} = getContext();
      const res = await http.put(`/elasticsearch/${props.selectedCluster.id}/doc/${_index}/${_id}`, {
        prependBasePath: false,
        query: {
          _type,
          is_new,
        },
        body: JSON.stringify(_source),
      });
      if(res.error){
        message.error(res.error)
        return res
      } 
      message.success('saved successfully');
      updateQuery()
      return res;
    },[props.selectedCluster, updateQuery])

    const deleteDocument = useCallback(async ({_index, _id, _type})=>{
      const {http} = getContext();
      const res = await http.delete(`/elasticsearch/${props.selectedCluster.id}/doc/${_index}/${_id}`, {
        prependBasePath: false,
        query: {
          _type,
        }
      });
      if(res.error){
        message.error(res.error)
        return res
      } 
      message.success('deleted successfully');
      updateQuery()
      return res
    },[props.selectedCluster, updateQuery])
  
  return (
    <Card bordered={false}>
      <SearchBar 
      {...{
        showSearchBar: false,
        showQueryBar: true,
        showQueryInput: true,
        showDatePicker: showDatePicker,
        showFilterBar: true,
        useDefaultBehaviors: true,
        screenTitle: '',
       // filters: filters,
        onFiltersUpdated: getContext().defaultFiltersUpdated(),
        indexPatterns: [indexPattern],
        filterManager,
        query: {
          language: 'kuery',
          query: queryParam || '',
        },
        queryStringManager,
        queryString: queryStringManager,
        timefilter,
        storage,
        onQuerySubmit: updateQuery,
        services,
       }} 
       />

<EuiPageBody className="dscPageBody" aria-describedby="savedSearchTitle">
          <EuiFlexGroup className="dscPageBody__contents" gutterSize="none">
            {indexPattern && <EuiFlexItem grow={false}>
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
              />
            </EuiFlexItem>}
            <EuiHideFor sizes={['xs', 's']}>
              <EuiFlexItem grow={false}>
                <EuiButtonIcon
                  iconType={isSidebarClosed ? 'menuRight' : 'menuLeft'}
                  iconSize="m"
                  size="s"
                  onClick={() => setIsSidebarClosed(!isSidebarClosed)}
                  data-test-subj="collapseSideBarButton"
                  aria-controls="discover-sidebar"
                  aria-expanded={isSidebarClosed ? 'false' : 'true'}
                  aria-label={'Toggle sidebar'}
                  buttonRef={collapseIcon}
                />
              </EuiFlexItem>
            </EuiHideFor>
            {resultState === 'none' && (
                  <DiscoverNoResults
                    timeFieldName={opts.timefield}
                    queryLanguage={state.query?.language || ''}
                    // data={opts.data}
                 //   error={fetchError}
                  />
                )}
                 {resultState !== 'none' && (
            <EuiFlexItem className="dscPageContent__wrapper" style={{overflow:'hidden'}}>
              <EuiPageContent
                // verticalPosition={resultState == 'loading' ? 'center' : undefined}
                // horizontalPosition={resultState == 'loading' ? 'center' : undefined}
                paddingSize="none"
                className={classNames('dscPageContent', {
                  'dscPageContent--centered': contentCentered,
                })}
              >
                <div style={{ display: resultState !== 'loading' ? 'none' : '' }}>
                  <div className="dscOverlay">
                    <LoadingSpinner />
                  </div>
                </div>
                {/* {resultState === 'loading' && <LoadingSpinner />} */}
                { (
                  <EuiFlexGroup
                    className="dscPageContent__inner"
                    direction="column"
                    alignItems="stretch"
                    gutterSize="none"
                    responsive={false}
                  >
                    {hits > 0 && <EuiFlexItem grow={false} className="dscResultCount">
                      <EuiFlexGroup alignItems="center" justifyContent="spaceBetween">
                        <EuiFlexItem
                          grow={false}
                          className="dscResuntCount__title eui-textTruncate eui-textNoWrap"
                        style={{width:'100%'}}
                        >
                           <HitsCounter
                            hits={hits > 0 ? hits : 0}
                            showResetButton={!!(opts.savedSearch && opts.savedSearch.id)}
                            onResetQuery={resetQuery}
                          />
                        </EuiFlexItem>
                        </EuiFlexGroup>
                        <EuiFlexGroup alignItems="center" style={{marginBottom:5}} justifyContent="spaceBetween">
                        {!hideChart && (
                          <EuiFlexItem className="dscResultCount__actions">
                            <TimechartHeader
                              dateFormat={'YYYY-MM-DD H:mm:ss'}
                              {...timeChartProps}
                            />
                          </EuiFlexItem>
                        )}
                      </EuiFlexGroup>
                    </EuiFlexItem>}
                    {!hideChart && opts.timefield && (
                      <EuiFlexItem>
                        <section
                          aria-label={'Histogram of found documents'}
                          className="dscTimechart"
                        >
                          {opts.chartAggConfigs && histogramData && rows.length !== 0 && (
                            <div
                              className='dscHistogramGrid'
                              data-test-subj="discoverChart"
                            >
                              <DiscoverHistogram
                                chartData={histogramData}
                                timefilterUpdateHandler={timefilterUpdateHandler}
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
                        <h2 className="euiScreenReaderOnly" id="documentsAriaLabel">
                         Documents
                        </h2>
                       
                        {(rows && rows.length > 0) ? (
                          <div className="dscDiscoverGrid">
                            {/* <DiscoverGrid
                              ariaLabelledBy="documentsAriaLabel"
                              columns={columns}
                              expandedDoc={expandedDoc}
                              indexPattern={indexPattern}
                              rows={rows}
                              sort={(state.sort) || []}
                              sampleSize={opts.sampleSize}
                              searchDescription={opts.savedSearch.description}
                              searchTitle={opts.savedSearch.lastSavedTitle}
                              setExpandedDoc={setExpandedDoc}
                              showTimeCol={
                                !!indexPattern.timeFieldName
                              }
                              settings={state.grid}
                              onAddColumn={onAddColumn}
                              onFilter={onAddFilter}
                              onRemoveColumn={onRemoveColumn}
                              onSetColumns={onSetColumns}
                              onSort={onSort}
                              useNewFieldsApi={false}
                            /> */}
                            <Table columns={columns}
                              sortOrder={state.sort ||[]}
                              indexPattern={indexPattern}
                              onFilter={onAddFilter}
                              onRemoveColumn={onRemoveColumn}
                              onMoveColumn={onMoveColumn}
                              onAddColumn={onAddColumn}
                              onChangeSortOrder={onSort}
                              document={{saveDocument, deleteDocument}}
                              hits={rows}/>
                          </div>
                        ):null}
                      </section>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                )}
              </EuiPageContent>
            </EuiFlexItem>)}
          </EuiFlexGroup>
        </EuiPageBody>
    </Card> 
  );
}

const DiscoverUI = (props)=>{
  const [viewID, setViewID] = useQueryParam('viewID', StringParam);
  const [queryParam, setQueryParam] = useQueryParam('query', StringParam);
  const [state, setState] = useState({
  });
  useMemo(()=>{
    const {http} = getContext();
    http.getServerBasePath = ()=>{
      return  '/elasticsearch/'+ props.selectedCluster.id;
    }
  }, [props.selectedCluster])
  useEffect(()=>{
    if(queryParam){
      queryStringManager.setQuery({
        query: queryParam,
        language: 'kuery'
      });
    }
    const {http} = getContext();
    const initialFetch = async ()=>{
      const ils = await services.savedObjects.savedObjectsClient.find({
        type: 'index-pattern',
        fields: ['title'],
        search:'',
        searchFields: ['title'],
        perPage: 100,
      });
      if(ils.length === 0){
        props.history.push('/data/views/');
        return
      }
      const defaultIndex = viewID || await http.fetch(http.getServerBasePath()+'/setting/defaultIndex')
      const targetIndex = ils.filter(il=>il.id == defaultIndex);
      const defaultIP = await services.indexPatternService.get(targetIndex.length > 0 ? defaultIndex : ils[0]?.id)
      setState({
        indexPatternList: ils,
        indexPattern: defaultIP
      });
      if(!viewID){
        setViewID(defaultIP.id);
      }
    }
    initialFetch();
    // return ()=>{
    //   queryStringManager.setQuery('');
    // }
  },[props.selectedCluster]);

  function changeIndexPattern(indexPattern){
    setState({
      ...state,
      indexPattern,
    });
    setViewID(indexPattern.id);
  }
 
  return (
    state.indexPatternList && state.indexPatternList.length > 0 ?
    <Discover {...props} {...state} changeIndexPattern={changeIndexPattern} /> : <div style={{height:'100%', width:'100%', display: 'flex',flexDirection:'column', justifyContent:'center'}}><Spin tip='正在初始化 ......'/></div>
  )
}

const DiscoverContainer = (props)=>{
  if(props.selectedCluster.id == ""){
    return null;
  }
  return <QueryParamProvider ReactRouterRoute={Route}>
    <DiscoverUI {...props}/>
  </QueryParamProvider>
}

export default connect(({
  global
})=>({
  selectedCluster: global.selectedCluster,
}))(DiscoverContainer)