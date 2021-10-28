import {AutocompleteService} from '../../components/kibana/data/public/autocomplete';
import {FilterManager} from '../../components/kibana/data/public/query/filter_manager/filter_manager';
import {QueryStringManager} from '../../components/kibana/data/public/query/query_string/query_string_manager';
import {Timefilter, TimeHistory} from '../../components/kibana/data/public/query/timefilter';
import { useState, useEffect, createContext } from 'react';
import { Subscription } from 'rxjs';
import {buildEsQuery} from '../../components/kibana/data/common/es_query/es_query/build_es_query';
import {getCalculateAutoTimeExpression} from '../../components/kibana/data/common/search/aggs/utils/calculate_auto_time_expression';
import {intervalOptions} from '../../components/kibana/data/common/search/aggs/buckets/_interval_options';
import {TimeBuckets} from '../../components/kibana/data/common/search/aggs/buckets/lib/time_buckets/time_buckets';
import moment from 'moment';
// import { fetch } from 'umi-request';
import {Fetch} from  '../../components/kibana/core/public/http/fetch';
import {SavedObjectsClient} from '../../components/kibana/core/public/saved_objects/saved_objects_client';
import {getIndexPatterns, setIndexPatterns} from '../../components/kibana/data/public/services';
import {
  IndexPatternsService,
  onRedirectNoIndexPattern,
  onUnsupportedTimePattern,
  IndexPatternsApiClient,
  SavedObjectsClientPublicToCommon
} from '../../components/kibana/data/public/index_patterns';
import {FieldFormatsRegistry,} from '../../components/kibana/data/common/field_formats';
import {baseFormattersPublic} from '../../components/kibana/data/public/field_formats';
import { deserializeFieldFormat } from '../../components/kibana/data/public/field_formats/utils/deserialize';
import {ESPrefix} from '@/services/common'

const timeBucketConfig = {
  'histogram:maxBars': 100,
  'histogram:barTarget': 50,
  dateFormat: 'YYYY-MM-DD',
  'dateFormat:scaled': [
    ['', 'HH:mm:ss.SSS'],
    ['PT1S', 'HH:mm:ss'],
    ['PT1M', 'HH:mm'],
    ['PT1H', 'YYYY-MM-DD HH:mm'],
    ['P1DT', 'YYYY-MM-DD'],
    ['P1YT', 'YYYY'],
  ],
};

const basePath = {
  get:()=>{
    return '';
  },
  prepend: (path)=>{
    return path;
  },
  remove: (url)=>{
    return url;
  },
  serverBasePath: '/api/',
}
const http = new Fetch({
  basePath,
});
const savedObjects = new SavedObjectsClient(http);
const savedObjectsClient = new SavedObjectsClientPublicToCommon(savedObjects);
const getFieldFormatsConfig = (key)=>{
  return {
    ['format:defaultTypeMap']: {
      "ip": { "id": "ip", "params": {} },
      "date": { "id": "date", "params": {} },
      "date_nanos": { "id": "date_nanos", "params": {}, "es": true },
      "number": { "id": "number", "params": {} },
      "boolean": { "id": "boolean", "params": {} },
      "histogram": { "id": "histogram", "params": {} },
      "_source": { "id": "_source", "params": {} },
      "_default_": { "id": "string", "params": {} }
    },
    'format:number:defaultPattern': '0,0.[000]',
    'format:percent:defaultPattern': '0,0.[000]%',
    'format:bytes:defaultPattern': '0,0.[0]b',
    'format:currency:defaultPattern': '($0,0.[00])',
  }[key];
}

const fieldFormats = new FieldFormatsRegistry();
fieldFormats.init(
  getFieldFormatsConfig,
  {
    parsedUrl: {
      origin: window.location.origin,
      pathname: window.location.pathname,
      basePath: basePath.get(),
    },
  },
  baseFormattersPublic
  );
  fieldFormats.deserialize = deserializeFieldFormat.bind(
    fieldFormats 
  );

const indexPatternsApiClient = new IndexPatternsApiClient(http);
const uiconfigs = {
  ['metaFields']: ['_source', '_id', '_type', '_index'],//'_score'
  defaultIndex: '',
};
const uiSettings = {
  get: (key)=>{
    return uiconfigs[key]
  },
  set: (key, val)=>{
    return uiconfigs[key] = val;
  },
  getAll: ()=>{
    return uiconfigs;
  }
};
const indexPatternService = new IndexPatternsService({
  uiSettings,
  savedObjectsClient,
  apiClient: indexPatternsApiClient,
  fieldFormats,
  onNotification:()=>{},
  onError:()=>{},
  onUnsupportedTimePattern,
  onRedirectNoIndexPattern,
});


export class Storage {
  store;

  constructor(store) {
    this.store = store;
  }

   get = (key) => {
    if (!this.store) {
      return null;
    }

    const storageItem = this.store.getItem(key);
    if (storageItem === null) {
      return null;
    }

    try {
      return JSON.parse(storageItem);
    } catch (error) {
      return null;
    }
  };

  set = (key, value) => {
    try {
      return this.store.setItem(key, JSON.stringify(value));
    } catch (e) {
      return false;
    }
  };

  remove = (key) => {
    return this.store.removeItem(key);
  };

  clear = () => {
    return this.store.clear();
  };
}


const filterManager = new FilterManager();
const storage = new Storage(localStorage); 
const queryStringManager = new QueryStringManager(storage);
const timefilterConfig = {
  timeDefaults: { from: 'now-15m', to: 'now' },
  refreshIntervalDefaults: { pause: true, value: 10000 },
};
const timeHistory = new TimeHistory(storage);
const timefilter = new Timefilter(timefilterConfig, timeHistory);

const autocomplete = new AutocompleteService();
autocomplete.setup({autocomplete: autocomplete, http:http}, {
  timefilter,
});

const getConfig = (key)=>{
  const kvals = {
  "histogram:maxBars": 100,
  "histogram:barTarget": 50,
  dateFormat: 'strict_date_optional_time',//'YYYY-MM-DD HH:mm:ss',
  'dateFormat:scaled': true,
  };
  return kvals[key] || '';
};

const calculateAutoTimeExpression = getCalculateAutoTimeExpression(getConfig)
// console.log(calculateAutoTimeExpression({
//   from: timefilter.getTime().from,
//   to: timefilter.getTime().to,
// }))
//const createAggConfigs = startAggService();

const getTimeBuckets = (interval) => {
  const timeBuckets = new TimeBuckets(timeBucketConfig);
  const bounds = timefilter.getBounds();
  // {
  //     min: moment(timefilter.getAbsoluteTime().from),
  //     max: moment(timefilter.getAbsoluteTime().to),
  // };
  timeBuckets.setBounds(bounds);
  timeBuckets.setInterval(interval);
  return timeBuckets; //.getInterval(true);
}


const defaultFiltersUpdated = () => {
  return (filters) => {
    filterManager.setFilters(filters);
  };
};
// const subscriptions = new Subscription();

// const [getIndexPatterns, setIndexPatterns] = createGetterSetter('IndexPatterns');

export const getContext = ()=>{
  return {
    autocomplete: autocomplete,
    filterManager,
    defaultFiltersUpdated,
    // useFilterManager,
    getIndexPatterns,
    setIndexPatterns,
    queryStringManager,
    storage,
    timefilter,
    getEsQuery,
    //calculateAutoTimeExpression, 
    getSearchParams,
    intervalOptions,
    //createAggConfigs,
    getTimeBuckets,
    fetchESRequest,
    services: {
      savedObjects:{
        client: savedObjects,
        savedObjectsClient,
      },
      data: {
        autocomplete,
      },
      indexPatternService,
    },
    http,
  }
}


const getEsQuery = (indexPattern) => {
  const timeFilter = timefilter.createFilter(indexPattern);
  return buildEsQuery(
    indexPattern,
    queryStringManager.getQuery(),
    [...filterManager.getFilters(), ...(timeFilter ? [timeFilter] : [])],
   // getEsQueryConfig(getUiSettings())
  );
}

const getSearchParams = (indexPattern, internal, sort) =>{
  // const timeExp = calculateAutoTimeExpression(timefilter.getTime());
  const timeExp = getTimeBuckets(internal).getInterval(true).expression;
  // console.log(timeExp, internal)
  let esSort = indexPattern.timeFieldName ? [{[indexPattern.timeFieldName]: {order: "desc"}}]: [];
  if(sort){
    esSort = sort.reduce((sorts, s)=>{
      const [sortField, sortDeriction] = s;
      sorts.push({
        [sortField]: {order: sortDeriction}
      })
      return sorts;
    }, [])
  }
  const isCalendarInterval = timeExp.includes('w') || timeExp.includes('d') || timeExp.includes('y') || timeExp.includes('M');

  let aggs = {
    2: {
      date_histogram: {
        //calendar_interval: 
        [isCalendarInterval? 'calendar_interval' : 'fixed_interval']: timeExp,
        field: indexPattern.timeFieldName,
        min_doc_count: 1,
        time_zone: "Asia/Shanghai"
      }
    }
  };
  let esRequest = {
    index: indexPattern.index || indexPattern.title,
    body:{
      query: getEsQuery(indexPattern),
      size: 500,
     
      highlight:{
        pre_tags:["@highlighted-field@"],
        post_tags:["@highlighted-field@"]
      },
      sort: esSort,//
    }
  }
  if(indexPattern.timeFieldName){
    esRequest.body['aggs']=aggs;
  }
  return esRequest;
}

const fetchESRequest = (params, clusterID) => {
  return fetch(`${ESPrefix}/${clusterID}/search/ese`, {
    headers:{
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify(params),
  }).then( res => {
    return res.json()
  }).then(resJson=>{
    return resJson;
  })
}