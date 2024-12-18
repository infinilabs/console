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
 * This function collects statistics from a SearchSource and a response
 * for the usage in the inspector stats panel. Pass in a searchSource and a response
 * and the returned object can be passed to the `stats` method of the request
 * logger.
 */

import { SearchResponse } from 'elasticsearch';
import { ISearchSource } from 'src/plugins/data/public';
import { RequestStatistics } from 'src/plugins/inspector/common';

/** @public */
export function getRequestInspectorStats(searchSource: ISearchSource) {
  const stats: RequestStatistics = {};
  const index = searchSource.getField('index');

  if (index) {
    stats.indexPattern = {
      label: 'Index pattern',
      value: index.title,
      description: 'The index pattern that connected to the Elasticsearch indices.',
    };
    stats.indexPatternId = {
      label: 'Index pattern ID',
      value: index.id!,
      description: 'The ID in the .kibana index.',
    };
  }

  return stats;
}

/** @public */
export function getResponseInspectorStats(
  resp: SearchResponse<unknown>,
  searchSource?: ISearchSource
) {
  const lastRequest =
    searchSource?.history && searchSource.history[searchSource.history.length - 1];
  const stats: RequestStatistics = {};

  if (resp && resp.took) {
    stats.queryTime = {
      label: 'Query time',
      value: `${resp.took}ms`,
      description: 
          'The time it took to process the query. ' +
          'Does not include the time to send the request or parse it in the browser.',
    };
  }

  if (resp && resp.hits) {
    stats.hitsTotal = {
      label:  'Hits (total)',
      value: `${resp.hits.total}`,
      description: 'The number of documents that match the query.',
    };

    stats.hits = {
      label: 'Hits',
      value: `${resp.hits.hits.length}`,
      description: 'The number of documents returned by the query.',
    };
  }

  if (lastRequest && (lastRequest.ms === 0 || lastRequest.ms)) {
    stats.requestTime = {
      label: 'Request time',
      value: `${lastRequest.ms}ms`,
      description:
          'The time of the request from the browser to Elasticsearch and back. ' +
          'Does not include the time the requested waited in the queue.',
    };
  }

  return stats;
}
