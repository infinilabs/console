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

import { sortBy } from "lodash";
import { HttpStart } from "kibana/public";
import { map, scan } from "rxjs/operators";
import { IndexPatternCreationConfig } from "../../../../../index_pattern_management/public";
import {
  MatchedItem,
  ResolveIndexResponse,
  ResolveIndexResponseItemIndexAttrs,
} from "../types";
import {
  DataPublicPluginStart,
  IEsSearchResponse,
} from "../../../../../data/public";
import { MAX_SEARCH_SIZE } from "../constants";

const aliasLabel = "Alias";
const dataStreamLabel = "Data stream";

const indexLabel = "Index";

const frozenLabel = "Frozen";

export const searchResponseToArray = (
  getIndexTags: IndexPatternCreationConfig["getIndexTags"],
  showAllIndices: boolean
) => (response: IEsSearchResponse<any>) => {
  const { rawResponse } = response;
  if (!rawResponse.aggregations) {
    return [];
  } else {
    return rawResponse.aggregations.indices.buckets
      .map((bucket: { key: string }) => {
        return bucket.key;
      })
      .filter((indexName: string) => {
        if (showAllIndices) {
          return true;
        } else {
          return !indexName.startsWith(".");
        }
      })
      .map((indexName: string) => {
        return {
          name: indexName,
          tags: getIndexTags(indexName),
          item: {},
        };
      });
  }
};

export const getIndicesViaSearch = async ({
  getIndexTags,
  pattern,
  searchClient,
  showAllIndices,
}: {
  getIndexTags: IndexPatternCreationConfig["getIndexTags"];
  pattern: string;
  searchClient: DataPublicPluginStart["search"]["search"];
  showAllIndices: boolean;
}): Promise<MatchedItem[]> =>
  searchClient({
    params: {
      ignoreUnavailable: true,
      expand_wildcards: showAllIndices ? "all" : "open",
      index: pattern,
      body: {
        size: 0, // no hits
        aggs: {
          indices: {
            terms: {
              field: "_index",
              size: MAX_SEARCH_SIZE,
            },
          },
        },
      },
    },
  })
    .pipe(map(searchResponseToArray(getIndexTags, showAllIndices)))
    .pipe(scan((accumulator = [], value) => accumulator.join(value)))
    .toPromise()
    .catch(() => []);

export const getIndicesViaResolve = async ({
  http,
  getIndexTags,
  pattern,
  showAllIndices,
}: {
  http: HttpStart;
  getIndexTags: IndexPatternCreationConfig["getIndexTags"];
  pattern: string;
  showAllIndices: boolean;
}) =>
  http
    .get<ResolveIndexResponse>(
      http.getServerBasePath() +
        `/internal/view-management/resolve_index/${pattern}`,
      {
        query: showAllIndices ? { expand_wildcards: "all" } : undefined,
      }
    )
    .then((response) => {
      if (!response) {
        return [];
      } else {
        return responseToItemArray(response, getIndexTags);
      }
    });

/**
 * Takes two MatchedItem[]s and returns a merged set, with the second set prrioritized over the first based on name
 *
 * @param matchedA
 * @param matchedB
 */

export const dedupeMatchedItems = (
  matchedA: MatchedItem[],
  matchedB: MatchedItem[]
) => {
  const mergedMatchedItems = matchedA.reduce((col, item) => {
    col[item.name] = item;
    return col;
  }, {} as Record<string, MatchedItem>);

  matchedB.reduce((col, item) => {
    col[item.name] = item;
    return col;
  }, mergedMatchedItems);

  return Object.values(mergedMatchedItems).sort((a, b) => {
    if (a.name > b.name) return 1;
    if (b.name > a.name) return -1;

    return 0;
  });
};

export async function getIndices({
  http,
  getIndexTags = () => [],
  pattern: rawPattern,
  showAllIndices = false,
  searchClient,
}: {
  http: HttpStart;
  getIndexTags?: IndexPatternCreationConfig["getIndexTags"];
  pattern: string;
  showAllIndices?: boolean;
  searchClient: DataPublicPluginStart["search"]["search"];
}): Promise<MatchedItem[]> {
  const pattern = rawPattern.trim();
  const isCCS = pattern.indexOf(":") !== -1;
  const requests: Array<Promise<MatchedItem[]>> = [];

  // Searching for `*:` fails for CCS environments. The search request
  // is worthless anyways as the we should only send a request
  // for a specific query (where we do not append *) if there is at
  // least a single character being searched for.
  if (pattern === "*:") {
    return [];
  }

  // This should never match anything so do not bother
  if (pattern === "" || pattern === ".") {
    return [];
  }

  // ES does not like just a `,*` and will throw a `[string_index_out_of_bounds_exception] String index out of range: 0`
  if (pattern.startsWith(",")) {
    return [];
  }

  const promiseResolve = getIndicesViaResolve({
    http,
    getIndexTags,
    pattern,
    showAllIndices,
  }).catch(() => []);
  requests.push(promiseResolve);

  if (isCCS) {
    // CCS supports ±1 major version. We won't be able to expect resolve endpoint to exist until v9
    const promiseSearch = getIndicesViaSearch({
      getIndexTags,
      pattern,
      searchClient,
      showAllIndices,
    }).catch(() => []);
    requests.push(promiseSearch);
  }

  const responses = await Promise.all(requests);

  if (responses.length === 2) {
    const [resolveResponse, searchResponse] = responses;
    return dedupeMatchedItems(searchResponse, resolveResponse);
  } else {
    return responses[0];
  }
}

export const responseToItemArray = (
  response: ResolveIndexResponse,
  getIndexTags: IndexPatternCreationConfig["getIndexTags"]
): MatchedItem[] => {
  const source: MatchedItem[] = [];

  (response.indices || []).forEach((index) => {
    const tags: MatchedItem["tags"] = [
      { key: "index", name: indexLabel, color: "default" },
    ];
    const isFrozen = (index.attributes || []).includes(
      ResolveIndexResponseItemIndexAttrs.FROZEN
    );

    tags.push(...getIndexTags(index.name));
    if (isFrozen) {
      tags.push({ name: frozenLabel, key: "frozen", color: "danger" });
    }

    source.push({
      name: index.name,
      tags,
      item: index,
    });
  });
  (response.aliases || []).forEach((alias) => {
    source.push({
      name: alias.name,
      tags: [{ key: "alias", name: aliasLabel, color: "default" }],
      item: alias,
    });
  });
  (response.data_streams || []).forEach((dataStream) => {
    source.push({
      name: dataStream.name,
      tags: [{ key: "data_stream", name: dataStreamLabel, color: "primary" }],
      item: dataStream,
    });
  });

  return sortBy(source, "name");
};
