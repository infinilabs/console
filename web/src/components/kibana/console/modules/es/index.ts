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
import $ from 'jquery';
// @ts-ignore
import { stringify } from 'query-string';

interface SendOptions {
  asSystemRequest?: boolean;
  clusterID?: string;
}

const esVersion: string[] = [];

export function getVersion() {
  return esVersion;
}

export function getContentType(body: unknown) {
  if (!body) return;
  return 'application/json';
}

export function extractClusterIDFromURL(){
  const matchs = location.hash.match(/\/elasticsearch\/(\w+)\/?/);
  if(!matchs){
    return ''
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
  const options: JQuery.AjaxSettings = {
    url: `/elasticsearch/${clusterID}/_proxy?` + stringify({ path, method }),
    headers: {
      'infini-xsrf': 'search-center',
      ...(asSystemRequest && { 'infini-request': 'true' }),
    },
    data,
    contentType: getContentType(data),
    cache: false,
    crossDomain: true,
    type: 'POST',
    dataType: 'json', // disable automatic guessing
  };

  $.ajax(options).then(
    (responseData: any, textStatus: string, jqXHR: unknown) => {
      wrappedDfd.resolveWith({}, [responseData, textStatus, jqXHR]);
    },
    ((jqXHR: { status: number; responseText: string }, textStatus: string, errorThrown: Error) => {
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
  const clusterID = extractClusterIDFromURL();
  if(!clusterID){
    console.log('can not get clusterid from url');
    return;
  }
  let url = `/elasticsearch/${clusterID}/command/_search`;
  if(title){
    url +=`?title=${title}`
  }
  return fetch(url, {
    method: 'GET',
  })
}

export function constructESUrl(baseUri: string, path: string) {
  baseUri = baseUri.replace(/\/+$/, '');
  path = path.replace(/^\/+/, '');
  return baseUri + '/' + path;
}

export function saveCommonCommand(params: any) {
  const clusterID = extractClusterIDFromURL();
  if(!clusterID){
    console.log('can not get clusterid from url');
    return;
  }
  return fetch(`/elasticsearch/${clusterID}/command`, {
    method: 'POST',
    body: JSON.stringify(params),
    headers:{
      'content-type': 'application/json'
    }
  })
}