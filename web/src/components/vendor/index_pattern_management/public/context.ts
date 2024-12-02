import {Fetch} from '../../core/public/http/fetch';
import {SavedObjectsClient} from '../../core/public/saved_objects/saved_objects_client';
import {SavedObjectsClientPublicToCommon} from '../../data/public/index_patterns';
import {
  IndexPatternManagementService,
} from './service';
// import { indexPatterns as ips} from '../../data/public'; 
// const {flattenHitWrapper} = ips;
import {
     IndexPatternsService,
     onRedirectNoIndexPattern,
     onUnsupportedTimePattern,
     IndexPatternsApiClient,
 } from '../../data/public/index_patterns';

import {FieldFormatsRegistry,} from '../../data/common/field_formats';
import {baseFormattersPublic} from '../../data/public/field_formats';
import { deserializeFieldFormat } from '../../data/public/field_formats/utils/deserialize';

const docLinks = {
  ELASTIC_WEBSITE_URL: 'https://elastic.co',
  DOC_LINK_VERSION: 'current',
  links: {
    indexPatterns: {},
    scriptedFields: {},
    runtimeFields: {},
    elasticsearch:{
      mapping: '',
    }
  } as any,
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
const getConfig = (key)=>{
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
    }
  }[key];
}

const fieldFormats = new FieldFormatsRegistry();
fieldFormats.init(
  getConfig,
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
const savedObjects = new SavedObjectsClient(http);
const savedObjectsClient = new SavedObjectsClientPublicToCommon(savedObjects);

const indexPatternManagementService = new IndexPatternManagementService()
indexPatternManagementService.setup({httpClient: http});
const indexPatternManagementStart = indexPatternManagementService.start()

const indexPatternsApiClient = new IndexPatternsApiClient(http);
const uiconfigs = {
  ['metaFields']: ['_source', '_id', '_type', '_index' ],//'_score'
  defaultIndex: '',
};
const uiSettings = {
  get: (key)=>{
    return uiconfigs[key]
  },
  set: (key, val, notSyncToServer)=>{
    uiconfigs[key] = val;
    if(!notSyncToServer){
      http.fetch(http.getServerBasePath()+'/setting', {
        method: 'POST',
        body: JSON.stringify({
          key,
          value: val,
        }),
      })
    }
  },
  getAll: ()=>{
    return uiconfigs;
  }
};
const indexPatterns = new IndexPatternsService({
  uiSettings,
  savedObjectsClient,
  apiClient: indexPatternsApiClient,
  fieldFormats,
  onNotification:()=>{},
  onError:()=>{},
  onUnsupportedTimePattern,
  onRedirectNoIndexPattern,
});
// indexPatterns.find()

export const useGlobalContext = ()=>{
  return {
    docLinks,
    uiSettings,
    savedObjects: {
      client: savedObjects,
    },
    notifications:{
      toasts:{},
    },
    setBreadcrumbs: ()=>{},
    indexPatternManagementStart,
    getMlCardState: () => 2,
    http,
    data: {
      indexPatterns,
      search: {

      },
      fieldFormats,
    },
    indexPatternFieldEditor: {
      getAll: () => [],
      getById: (id: string) => {
        return {}
      },
    },
  };
}
