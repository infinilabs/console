/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/**
 * @name SearchSource
 *
 * @description A promise-based stream of search results that can inherit from other search sources.
 *
 * Because filters/queries in Kibana have different levels of persistence and come from different
 * places, it is important to keep track of where filters come from for when they are saved back to
 * the savedObject store in the Kibana index. To do this, we create trees of searchSource objects
 * that can have associated query parameters (index, query, filter, etc) which can also inherit from
 * other searchSource objects.
 *
 * At query time, all of the searchSource objects that have subscribers are "flattened", at which
 * point the query params from the searchSource are collected while traversing up the inheritance
 * chain. At each link in the chain a decision about how to merge the query params is made until a
 * single set of query parameters is created for each active searchSource (a searchSource with
 * subscribers).
 *
 * That set of query parameters is then sent to elasticsearch. This is how the filter hierarchy
 * works in Kibana.
 *
 * Visualize, starting from a new search:
 *
 *  - the `savedVis.searchSource` is set as the `appSearchSource`.
 *  - The `savedVis.searchSource` would normally inherit from the `appSearchSource`, but now it is
 *    upgraded to inherit from the `rootSearchSource`.
 *  - Any interaction with the visualization will still apply filters to the `appSearchSource`, so
 *    they will be stored directly on the `savedVis.searchSource`.
 *  - Any interaction with the time filter will be written to the `rootSearchSource`, so those
 *    filters will not be saved by the `savedVis`.
 *  - When the `savedVis` is saved to elasticsearch, it takes with it all the filters that are
 *    defined on it directly, but none of the ones that it inherits from other places.
 *
 * Visualize, starting from an existing search:
 *
 *  - The `savedVis` loads the `savedSearch` on which it is built.
 *  - The `savedVis.searchSource` is set to inherit from the `saveSearch.searchSource` and set as
 *    the `appSearchSource`.
 *  - The `savedSearch.searchSource`, is set to inherit from the `rootSearchSource`.
 *  - Then the `savedVis` is written to elasticsearch it will be flattened and only include the
 *    filters created in the visualize application and will reconnect the filters from the
 *    `savedSearch` at runtime to prevent losing the relationship
 *
 * Dashboard search sources:
 *
 *  - Each panel in a dashboard has a search source.
 *  - The `savedDashboard` also has a searchsource, and it is set as the `appSearchSource`.
 *  - Each panel's search source inherits from the `appSearchSource`, meaning that they inherit from
 *    the dashboard search source.
 *  - When a filter is added to the search box, or via a visualization, it is written to the
 *    `appSearchSource`.
 */

// import { setWith } from '@elastic/safer-lodash-set';
import { setWith } from "lodash";
import {
  uniqueId,
  uniq,
  extend,
  pick,
  difference,
  omit,
  isObject,
  keys,
  isFunction,
} from "lodash";
import { normalizeSortRequest } from "./normalize_sort_request";
import { filterDocvalueFields } from "./filter_docvalue_fields";
import { fieldWildcardFilter } from "../../../../utils/common";
import { IIndexPattern } from "../../index_patterns";
import { IEsSearchRequest, IEsSearchResponse, ISearchOptions } from "../..";
import { IKibanaSearchRequest, IKibanaSearchResponse } from "../types";
import {
  ISearchSource,
  SearchSourceOptions,
  SearchSourceFields,
} from "./types";
import {
  FetchHandlers,
  RequestFailure,
  getSearchParamsFromRequest,
  SearchRequest,
} from "./fetch";

import {
  getEsQueryConfig,
  buildEsQuery,
  Filter,
  UI_SETTINGS,
} from "../../../common";
import { getHighlightRequest } from "../../../common/field_formats";
import { fetchSoon } from "./legacy";
import { extractReferences } from "./extract_references";

/** @internal */
export const searchSourceRequiredUiSettings = [
  "dateFormat:tz",
  UI_SETTINGS.COURIER_BATCH_SEARCHES,
  UI_SETTINGS.COURIER_CUSTOM_REQUEST_PREFERENCE,
  UI_SETTINGS.COURIER_IGNORE_FILTER_IF_FIELD_NOT_IN_INDEX,
  UI_SETTINGS.COURIER_MAX_CONCURRENT_SHARD_REQUESTS,
  UI_SETTINGS.COURIER_SET_REQUEST_PREFERENCE,
  UI_SETTINGS.DOC_HIGHLIGHT,
  UI_SETTINGS.META_FIELDS,
  UI_SETTINGS.QUERY_ALLOW_LEADING_WILDCARDS,
  UI_SETTINGS.QUERY_STRING_OPTIONS,
  UI_SETTINGS.SEARCH_INCLUDE_FROZEN,
  UI_SETTINGS.SORT_OPTIONS,
];

export interface SearchSourceDependencies extends FetchHandlers {
  // Types are nearly identical to ISearchGeneric, except we are making
  // search options required here and returning a promise instead of observable.
  search: <
    SearchStrategyRequest extends IKibanaSearchRequest = IEsSearchRequest,
    SearchStrategyResponse extends IKibanaSearchResponse = IEsSearchResponse
  >(
    request: SearchStrategyRequest,
    options: ISearchOptions
  ) => Promise<SearchStrategyResponse>;
}

/** @public **/
export class SearchSource {
  private id: string = uniqueId("data_source");
  private searchStrategyId?: string;
  private parent?: SearchSource;
  private requestStartHandlers: Array<
    (searchSource: SearchSource, options?: ISearchOptions) => Promise<unknown>
  > = [];
  private inheritOptions: SearchSourceOptions = {};
  public history: SearchRequest[] = [];
  private fields: SearchSourceFields;
  private readonly dependencies: SearchSourceDependencies;

  constructor(
    fields: SearchSourceFields = {},
    dependencies: SearchSourceDependencies
  ) {
    this.fields = fields;
    this.dependencies = dependencies;
  }

  /** ***
   * PUBLIC API
   *****/

  /**
   * internal, dont use
   * @param searchStrategyId
   */
  setPreferredSearchStrategyId(searchStrategyId: string) {
    this.searchStrategyId = searchStrategyId;
  }

  /**
   * sets value to a single search source feild
   * @param field: field name
   * @param value: value for the field
   */
  setField<K extends keyof SearchSourceFields>(
    field: K,
    value: SearchSourceFields[K]
  ) {
    if (value == null) {
      delete this.fields[field];
    } else {
      this.fields[field] = value;
    }
    return this;
  }

  /**
   * Internal, do not use. Overrides all search source fields with the new field array.
   *
   * @private
   * @param newFields New field array.
   */
  setFields(newFields: SearchSourceFields) {
    this.fields = newFields;
    return this;
  }

  /**
   * returns search source id
   */
  getId() {
    return this.id;
  }

  /**
   * returns all search source fields
   */
  getFields() {
    return { ...this.fields };
  }

  /**
   * Gets a single field from the fields
   */
  getField<K extends keyof SearchSourceFields>(
    field: K,
    recurse = true
  ): SearchSourceFields[K] {
    if (!recurse || this.fields[field] !== void 0) {
      return this.fields[field];
    }
    const parent = this.getParent();
    return parent && parent.getField(field);
  }

  /**
   * Get the field from our own fields, don't traverse up the chain
   */
  getOwnField<K extends keyof SearchSourceFields>(
    field: K
  ): SearchSourceFields[K] {
    return this.getField(field, false);
  }

  /**
   * @deprecated Don't use.
   */
  create() {
    return new SearchSource({}, this.dependencies);
  }

  /**
   * creates a copy of this search source (without its children)
   */
  createCopy() {
    const newSearchSource = new SearchSource({}, this.dependencies);
    newSearchSource.setFields({ ...this.fields });
    // when serializing the internal fields we lose the internal classes used in the index
    // pattern, so we have to set it again to workaround this behavior
    newSearchSource.setField("index", this.getField("index"));
    newSearchSource.setParent(this.getParent());
    return newSearchSource;
  }

  /**
   * creates a new child search source
   * @param options
   */
  createChild(options = {}) {
    const childSearchSource = new SearchSource({}, this.dependencies);
    childSearchSource.setParent(this, options);
    return childSearchSource;
  }

  /**
   * Set a searchSource that this source should inherit from
   * @param  {SearchSource} parent - the parent searchSource
   * @param  {SearchSourceOptions} options - the inherit options
   * @return {this} - chainable
   */
  setParent(parent?: ISearchSource, options: SearchSourceOptions = {}) {
    this.parent = parent as SearchSource;
    this.inheritOptions = options;
    return this;
  }

  /**
   * Get the parent of this SearchSource
   * @return {undefined|searchSource}
   */
  getParent() {
    return this.parent;
  }

  /**
   * Fetch this source and reject the returned Promise on error
   *
   * @async
   */
  async fetch(options: ISearchOptions = {}) {
    const { getConfig } = this.dependencies;
    await this.requestIsStarting(options);

    const searchRequest = await this.flatten();
    this.history = [searchRequest];

    let response;
    if (getConfig(UI_SETTINGS.COURIER_BATCH_SEARCHES)) {
      response = await this.legacyFetch(searchRequest, options);
    } else {
      response = await this.fetchSearch(searchRequest, options);
    }

    // TODO: Remove casting when https://github.com/elastic/elasticsearch-js/issues/1287 is resolved
    if ((response as any).error) {
      throw new RequestFailure(null, response);
    }

    return response;
  }

  /**
   *  Add a handler that will be notified whenever requests start
   *  @param  {Function} handler
   *  @return {undefined}
   */
  onRequestStart(
    handler: (
      searchSource: SearchSource,
      options?: ISearchOptions
    ) => Promise<unknown>
  ) {
    this.requestStartHandlers.push(handler);
  }

  /**
   * Returns body contents of the search request, often referred as query DSL.
   */
  async getSearchRequestBody() {
    const searchRequest = await this.flatten();
    return searchRequest.body;
  }

  /**
   * Completely destroy the SearchSource.
   * @return {undefined}
   */
  destroy() {
    this.requestStartHandlers.length = 0;
  }

  /** ****
   * PRIVATE APIS
   ******/

  /**
   * Run a search using the search service
   * @return {Promise<SearchResponse<unknown>>}
   */
  private fetchSearch(searchRequest: SearchRequest, options: ISearchOptions) {
    const { search, getConfig, onResponse } = this.dependencies;

    const params = getSearchParamsFromRequest(searchRequest, {
      getConfig,
    });

    return search(
      { params, indexType: searchRequest.indexType },
      options
    ).then(({ rawResponse }) => onResponse(searchRequest, rawResponse));
  }

  /**
   * Run a search using the search service
   * @return {Promise<SearchResponse<unknown>>}
   */
  private async legacyFetch(
    searchRequest: SearchRequest,
    options: ISearchOptions
  ) {
    const { getConfig, legacy, onResponse } = this.dependencies;

    return await fetchSoon(
      searchRequest,
      {
        ...(this.searchStrategyId && {
          searchStrategyId: this.searchStrategyId,
        }),
        ...options,
      },
      {
        getConfig,
        onResponse,
        legacy,
      }
    );
  }

  /**
   *  Called by requests of this search source when they are started
   *  @param options
   *  @return {Promise<undefined>}
   */
  private requestIsStarting(options: ISearchOptions = {}) {
    const handlers = [...this.requestStartHandlers];
    // If callParentStartHandlers has been set to true, we also call all
    // handlers of parent search sources.
    if (this.inheritOptions.callParentStartHandlers) {
      let searchSource = this.getParent();
      while (searchSource) {
        handlers.push(...searchSource.requestStartHandlers);
        searchSource = searchSource.getParent();
      }
    }

    return Promise.all(handlers.map((fn) => fn(this, options)));
  }

  /**
   * Used to merge properties into the data within ._flatten().
   * The data is passed in and modified by the function
   *
   * @param  {object} data - the current merged data
   * @param  {*} val - the value at `key`
   * @param  {*} key - The key of `val`
   * @return {undefined}
   */
  private mergeProp<K extends keyof SearchSourceFields>(
    data: SearchRequest,
    val: SearchSourceFields[K],
    key: K
  ) {
    val = typeof val === "function" ? val(this) : val;
    if (val == null || !key) return;

    const addToRoot = (rootKey: string, value: any) => {
      data[rootKey] = value;
    };

    /**
     * Add the key and val to the body of the request
     */
    const addToBody = (bodyKey: string, value: any) => {
      // ignore if we already have a value
      if (data.body[bodyKey] == null) {
        data.body[bodyKey] = value;
      }
    };

    const { getConfig } = this.dependencies;

    switch (key) {
      case "filter":
        return addToRoot("filters", (data.filters || []).concat(val));
      case "query":
        return addToRoot(key, (data[key] || []).concat(val));
      case "fields":
        const fields = uniq((data[key] || []).concat(val));
        return addToRoot(key, fields);
      case "index":
      case "type":
      case "highlightAll":
        return key && data[key] == null && addToRoot(key, val);
      case "searchAfter":
        return addToBody("search_after", val);
      case "source":
        return addToBody("_source", val);
      case "sort":
        const sort = normalizeSortRequest(
          val,
          this.getField("index"),
          getConfig(UI_SETTINGS.SORT_OPTIONS)
        );
        return addToBody(key, sort);
      default:
        return addToBody(key, val);
    }
  }

  /**
   * Walk the inheritance chain of a source and return its
   * flat representation (taking into account merging rules)
   * @returns {Promise}
   * @resolved {Object|null} - the flat data of the SearchSource
   */
  private mergeProps(root = this, searchRequest: SearchRequest = { body: {} }) {
    Object.entries(this.fields).forEach(([key, value]) => {
      this.mergeProp(searchRequest, value, key as keyof SearchSourceFields);
    });
    if (this.parent) {
      this.parent.mergeProps(root, searchRequest);
    }
    return searchRequest;
  }

  private getIndexType(index?: IIndexPattern) {
    if (this.searchStrategyId) {
      return this.searchStrategyId === "default"
        ? undefined
        : this.searchStrategyId;
    } else {
      return index?.type;
    }
  }

  private flatten() {
    const searchRequest = this.mergeProps();

    searchRequest.body = searchRequest.body || {};
    const { body, index, fields, query, filters, highlightAll } = searchRequest;
    searchRequest.indexType = this.getIndexType(index);

    const computedFields = index ? index.getComputedFields() : {};

    body.stored_fields = computedFields.storedFields;
    body.script_fields = body.script_fields || {};
    extend(body.script_fields, computedFields.scriptFields);

    const defaultDocValueFields = computedFields.docvalueFields
      ? computedFields.docvalueFields
      : [];
    body.docvalue_fields = body.docvalue_fields || defaultDocValueFields;

    if (!body.hasOwnProperty("_source") && index) {
      body._source = index.getSourceFiltering();
    }

    const { getConfig } = this.dependencies;

    if (body._source) {
      // exclude source fields for this index pattern specified by the user
      const filter = fieldWildcardFilter(
        body._source.excludes,
        getConfig(UI_SETTINGS.META_FIELDS)
      );
      body.docvalue_fields = body.docvalue_fields.filter((docvalueField: any) =>
        filter(docvalueField.field)
      );
    }

    // if we only want to search for certain fields
    if (fields) {
      // filter out the docvalue_fields, and script_fields to only include those that we are concerned with
      body.docvalue_fields = filterDocvalueFields(body.docvalue_fields, fields);
      body.script_fields = pick(body.script_fields, fields);

      // request the remaining fields from both stored_fields and _source
      const remainingFields = difference(fields, keys(body.script_fields));
      body.stored_fields = remainingFields;
      setWith(body, "_source.includes", remainingFields, (nsValue) =>
        isObject(nsValue) ? {} : nsValue
      );
    }

    const esQueryConfigs = getEsQueryConfig({ get: getConfig });
    body.query = buildEsQuery(index, query, filters, esQueryConfigs);

    if (highlightAll && body.query) {
      body.highlight = getHighlightRequest(
        body.query,
        getConfig(UI_SETTINGS.DOC_HIGHLIGHT)
      );
      delete searchRequest.highlightAll;
    }

    return searchRequest;
  }

  /**
   * serializes search source fields (which can later be passed to {@link ISearchStartSearchSource})
   */
  public getSerializedFields() {
    const {
      filter: originalFilters,
      ...searchSourceFields
    } = omit(this.getFields(), ["sort", "size"]);
    let serializedSearchSourceFields: SearchSourceFields = {
      ...searchSourceFields,
      index: (searchSourceFields.index
        ? searchSourceFields.index.id
        : undefined) as any,
    };
    if (originalFilters) {
      const filters = this.getFilters(originalFilters);
      serializedSearchSourceFields = {
        ...serializedSearchSourceFields,
        filter: filters,
      };
    }
    return serializedSearchSourceFields;
  }

  /**
   * Serializes the instance to a JSON string and a set of referenced objects.
   * Use this method to get a representation of the search source which can be stored in a saved object.
   *
   * The references returned by this function can be mixed with other references in the same object,
   * however make sure there are no name-collisions. The references will be named `kibanaSavedObjectMeta.searchSourceJSON.index`
   * and `kibanaSavedObjectMeta.searchSourceJSON.filter[<number>].meta.index`.
   *
   * Using `createSearchSource`, the instance can be re-created.
   * @public */
  public serialize() {
    const [searchSourceFields, references] = extractReferences(
      this.getSerializedFields()
    );
    return { searchSourceJSON: JSON.stringify(searchSourceFields), references };
  }

  private getFilters(filterField: SearchSourceFields["filter"]): Filter[] {
    if (!filterField) {
      return [];
    }

    if (Array.isArray(filterField)) {
      return filterField;
    }

    if (isFunction(filterField)) {
      return this.getFilters(filterField());
    }

    return [filterField];
  }
}
