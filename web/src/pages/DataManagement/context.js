import { AutocompleteService } from "../../components/vendor/data/public/autocomplete";
import { FilterManager } from "../../components/vendor/data/public/query/filter_manager/filter_manager";
import { QueryStringManager } from "../../components/vendor/data/public/query/query_string/query_string_manager";
import {
  Timefilter,
  TimeHistory,
} from "../../components/vendor/data/public/query/timefilter";
import { useState, useEffect, createContext } from "react";
import { Subscription } from "rxjs";
import { buildEsQuery } from "../../components/vendor/data/common/es_query/es_query/build_es_query";
import { getCalculateAutoTimeExpression } from "../../components/vendor/data/common/search/aggs/utils/calculate_auto_time_expression";
import { intervalOptions } from "../../components/vendor/data/common/search/aggs/buckets/_interval_options";
import { TimeBuckets } from "../../components/vendor/data/common/search/aggs/buckets/lib/time_buckets/time_buckets";
import moment from "moment";
// import { fetch } from 'umi-request';
import { Fetch } from "../../components/vendor/core/public/http/fetch";
import { SavedObjectsClient } from "../../components/vendor/core/public/saved_objects/saved_objects_client";
import {
  getIndexPatterns,
  setIndexPatterns,
} from "../../components/vendor/data/public/services";
import {
  IndexPatternsService,
  onRedirectNoIndexPattern,
  onUnsupportedTimePattern,
  IndexPatternsApiClient,
  SavedObjectsClientPublicToCommon,
} from "../../components/vendor/data/public/index_patterns";
import { FieldFormatsRegistry } from "../../components/vendor/data/common/field_formats";
import { baseFormattersPublic } from "../../components/vendor/data/public/field_formats";
import { deserializeFieldFormat } from "../../components/vendor/data/public/field_formats/utils/deserialize";
import { getHighlightRequest } from "../../components/vendor/data/common/field_formats";
import { UI_SETTINGS } from "../../components/vendor/data/common/constants";
import { ESPrefix } from "@/services/common";
import request from "@/utils/request";
import { getTimezone } from "@/utils/utils";

const timeBucketConfig = {
  "histogram:maxBars": 100,
  "histogram:barTarget": 50,
  dateFormat: "YYYY-MM-DD",
  "dateFormat:scaled": [
    ["", "HH:mm:ss.SSS"],
    ["PT1S", "HH:mm:ss"],
    ["PT1M", "HH:mm"],
    ["PT1H", "YYYY-MM-DD HH:mm"],
    ["P1DT", "YYYY-MM-DD"],
    ["P1YT", "YYYY"],
  ],
};

const basePath = {
  get: () => {
    return "";
  },
  prepend: (path) => {
    return path;
  },
  remove: (url) => {
    return url;
  },
  serverBasePath: "/api/",
};
const http = new Fetch({
  basePath,
});
const savedObjects = new SavedObjectsClient(http);
const savedObjectsClient = new SavedObjectsClientPublicToCommon(savedObjects);
const getFieldFormatsConfig = (key) => {
  return {
    ["format:defaultTypeMap"]: {
      ip: { id: "ip", params: {} },
      date: { id: "date", params: {} },
      date_nanos: { id: "date_nanos", params: {}, es: true },
      number: { id: "number", params: {} },
      boolean: { id: "boolean", params: {} },
      histogram: { id: "histogram", params: {} },
      _source: { id: "_source", params: {} },
      _default_: { id: "string", params: {} },
    },
    "format:number:defaultPattern": "0,0.[000]",
    "format:percent:defaultPattern": "0,0.[000]%",
    "format:bytes:defaultPattern": "0,0.[0]b",
    "format:currency:defaultPattern": "($0,0.[00])",
  }[key];
};

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
fieldFormats.deserialize = deserializeFieldFormat.bind(fieldFormats);

const indexPatternsApiClient = new IndexPatternsApiClient(http);
const uiconfigs = {
  ["metaFields"]: ["_source", "_id", "_type", "_index"], //'_score'
  [UI_SETTINGS.DOC_HIGHLIGHT]: true,
  defaultIndex: "",
};
const uiSettings = {
  get: (key) => {
    return uiconfigs[key];
  },
  set: (key, val) => {
    return (uiconfigs[key] = val);
  },
  getAll: () => {
    return uiconfigs;
  },
};
const indexPatternService = new IndexPatternsService({
  uiSettings,
  savedObjectsClient,
  apiClient: indexPatternsApiClient,
  fieldFormats,
  onNotification: () => {},
  onError: () => {},
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
  timeDefaults: { from: "now-15m", to: "now" },
  refreshIntervalDefaults: { pause: true, value: 10000 },
};
const timeHistory = new TimeHistory(storage);
const timefilter = new Timefilter(timefilterConfig, timeHistory);

const autocomplete = new AutocompleteService();
autocomplete.setup(
  { autocomplete: autocomplete, http: http },
  {
    timefilter,
  }
);

const getConfig = (key) => {
  const kvals = {
    "histogram:maxBars": 100,
    "histogram:barTarget": 50,
    dateFormat: "strict_date_optional_time", //'YYYY-MM-DD HH:mm:ss',
    "dateFormat:scaled": true,
  };
  return kvals[key] || "";
};

const calculateAutoTimeExpression = getCalculateAutoTimeExpression(getConfig);
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
};

const defaultFiltersUpdated = () => {
  return (filters) => {
    filterManager.setFilters(filters);
  };
};
// const subscriptions = new Subscription();

// const [getIndexPatterns, setIndexPatterns] = createGetterSetter('IndexPatterns');

export const getContext = () => {
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
      savedObjects: {
        client: savedObjects,
        savedObjectsClient,
      },
      data: {
        autocomplete,
      },
      indexPatternService,
    },
    http,
  };
};

  const getEsQuery = (indexPattern) => {
    const timeFilter = timefilter.createFilter(indexPattern);

    const rawQuery = queryStringManager.getQuery();
    try {
      return buildEsQuery(
        indexPattern,
        [
          {
            ...rawQuery,
            query: rawQuery?.query,
          }
        ],
        [...filterManager.getFilters(), ...(timeFilter ? [timeFilter] : [])]
      );
    } catch (e) {
      console.warn("KQL parse failed, fallback to match_all", e);

      return {
        query: { match_all: {} }
      };
    }
  };

const getSearchParams = (
  indexPattern,
  internal,
  sort,
  inputAggs,
  distinctParams,
  queryFrom,
  trackTotalHits,
  size = 20,
  searchAfter,
) => {
  // const timeExp = calculateAutoTimeExpression(timefilter.getTime());
  const timeExp = getTimeBuckets(internal).getInterval(true).expression;
  // console.log(timeExp, internal)
  let esSort = indexPattern.timeFieldName
    ? [{ [indexPattern.timeFieldName]: { order: "desc" } }]
    : [];
  if (sort) {
    esSort = sort.reduce((sorts, s) => {
      const [sortField, sortDeriction] = s;
      sorts.push({
        [sortField]: { order: sortDeriction },
      });
      return sorts;
    }, []);
  }
  const isCalendarInterval =
    timeExp.includes("w") ||
    timeExp.includes("d") ||
    timeExp.includes("y") ||
    timeExp.includes("M");

  // Reduce buckets for large time ranges to improve performance
  const bounds = timefilter.getBounds();
  const rangeMs = bounds.max - bounds.min;
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const bucketCount = rangeMs >= sevenDaysMs ? 80 : 120;
  const aggs = {
    counts: {
      auto_date_histogram: {
        field: indexPattern.timeFieldName,
        buckets: bucketCount,
        time_zone: getTimezone(),
      },
    },
  };
  let esRequest = {
    index: indexPattern.index || indexPattern.title,
    body: {
      query: getEsQuery(indexPattern),
      size: size,
      sort: esSort, //
    },
  };
  const highlightRequest = getHighlightRequest(
    esRequest.body.query,
    uiSettings.get(UI_SETTINGS.DOC_HIGHLIGHT)
  );
  if (highlightRequest) {
    esRequest.body.highlight = highlightRequest;
  }
  // Use search_after for pagination, fall back to from for first page
  if (searchAfter) {
    esRequest.body["search_after"] = searchAfter;
  } else {
    esRequest.body["from"] = queryFrom || 0;
  }
  // Only include aggs on the first page
  if (!searchAfter && indexPattern.timeFieldName) {
    esRequest.body["aggs"] = aggs;
  }
  if (!searchAfter && inputAggs) {
    esRequest.body["aggs"] = inputAggs;
  }
  if (distinctParams?.field && distinctParams?.enabled) {
    esRequest["distinct_by_field"] = distinctParams;
  }
  if (trackTotalHits) {
    esRequest.body["track_total_hits"] = trackTotalHits;
  } else {
    // Default to 10000 to avoid expensive full count on large indices
    esRequest.body["track_total_hits"] = 10000;
  }

  return esRequest;
};

const fetchESRequest = (params, clusterID, option) => {
  return request(`${ESPrefix}/${clusterID}/search/ese${option?.searchTimeout ? `?timeout=${option.searchTimeout}` : ''}`, {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify(params),
    ...(option || {})
  });
};
