/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

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

/*
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

// @ts-ignore
import $ from "jquery";
// @ts-ignore
import { stringify } from "query-string";
import { pathPrefix, ESPrefix } from "@/services/common";
import { getAuthorizationHeader } from "@/utils/authority";

interface SendOptions {
  asSystemRequest?: boolean;
  clusterID?: string;
}

const esVersion: string[] = [];

export function getVersion() {
  return esVersion;
}

export function getContentType(body: unknown) {
  if (!body) return "text/plain";
  return "application/json";
}

export function extractClusterIDFromURL() {
  const matchs = location.hash.match(/\/elasticsearch\/(\w+)\/?/);
  if (!matchs) {
    return "";
  }
  return matchs[1];
}

export function send(
  method: string,
  path: string,
  data: string | object,
  { asSystemRequest, clusterID }: SendOptions = {}
) {
  const wrappedDfd = $.Deferred();

  // const clusterID = extractClusterIDFromURL();
  // if(!clusterID){
  //   console.log('can not get clusterid from url');
  //   return;
  // }
  // @ts-ignore
  const headers = {};
  const authorizationHeader = getAuthorizationHeader();
  if (authorizationHeader) {
    headers["Authorization"] = authorizationHeader;
  }
  const options: JQuery.AjaxSettings = {
    url: window.routerBase.replace(/\/+$/, "") + `${ESPrefix}/${clusterID}/_proxy?` + stringify({ path, method }),
    // headers: {
    //   'infini-xsrf': 'search-center',
    //   'origin': location.origin,
    //   ...(asSystemRequest && { 'infini-request': 'true' }),
    // },
    headers,
    data,
    contentType: getContentType(data),
    cache: false,
    // crossDomain: true,
    type: "POST",
    dataType: "json", // disable automatic guessing
  };

  $.ajax(options).then(
    (responseData: any, textStatus: string, jqXHR: unknown) => {
      wrappedDfd.resolveWith({}, [responseData, textStatus, jqXHR]);
    },
    ((
      jqXHR: { status: number; responseText: string },
      textStatus: string,
      errorThrown: Error
    ) => {
      if (jqXHR.status === 0) {
        jqXHR.responseText =
          "\n\nFailed to connect to Console's backend.\nPlease check the  server is up and running";
      }
      wrappedDfd.rejectWith({}, [jqXHR, textStatus, errorThrown]);
    }) as any
  );
  return wrappedDfd;
}

export function queryCommonCommands(title?: string) {
  const headers = {
    "content-type": "application/json",
  };
  const authorizationHeader = getAuthorizationHeader();
  if (authorizationHeader) {
    headers["Authorization"] = authorizationHeader;
  }
  let url = window.routerBase.replace(/\/+$/, "") + `${pathPrefix}/elasticsearch/command?size=1000`;
  if (title) {
    url += `&title=${title}`;
  }
  return fetch(url, {
    method: "GET",
    headers: headers,
  });
}

export function constructESUrl(baseUri: string, path: string) {
  if(baseUri){
    baseUri = baseUri.replace(/\/+$/, "");
  }
  path = path.replace(/^\/+/, "");
  return baseUri + "/" + path;
}

export function saveCommonCommand(params: any) {
  const headers = {
    "content-type": "application/json",
  };
  const authorizationHeader = getAuthorizationHeader();
  if (authorizationHeader) {
    headers["Authorization"] = authorizationHeader;
  }
  let url = window.routerBase.replace(/\/+$/, "") + `${pathPrefix}//elasticsearch/command`;
  return fetch(url, {
    method: "POST",
    body: JSON.stringify(params),
    headers: headers,
  });
}
