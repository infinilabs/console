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

import { values } from 'lodash';
import { format as formatUrl } from 'url';
import { Agent as HttpsAgent, AgentOptions } from 'https';

import { WildcardMatcher } from './wildcard_matcher';

interface Config {
  match: {
    protocol: string;
    host: string;
    port: string;
    path: string;
  };
  ssl?: { verify?: boolean; ca?: string; cert?: string; key?: string };
  timeout: number;
}

export class ProxyConfig {
  // @ts-ignore
  private id: string;
  private matchers: {
    protocol: WildcardMatcher;
    host: WildcardMatcher;
    port: WildcardMatcher;
    path: WildcardMatcher;
  };

  private readonly timeout: number;

  private readonly sslAgent?: HttpsAgent;

  private verifySsl: undefined | boolean;

  constructor(config: Config) {
    config = {
      ...config,
    };

    // -----
    // read "match" info
    // -----
    const rawMatches = {
      ...config.match,
    };
    this.id =
      formatUrl({
        protocol: rawMatches.protocol,
        hostname: rawMatches.host,
        port: rawMatches.port,
        pathname: rawMatches.path,
      }) || '*';

    this.matchers = {
      protocol: new WildcardMatcher(rawMatches.protocol),
      host: new WildcardMatcher(rawMatches.host),
      port: new WildcardMatcher(rawMatches.port),
      path: new WildcardMatcher(rawMatches.path, '/'),
    };

    // -----
    // read config vars
    // -----
    this.timeout = config.timeout;
    this.sslAgent = this._makeSslAgent(config);
  }

  _makeSslAgent(config: Config) {
    const ssl: Config['ssl'] = config.ssl || {};
    this.verifySsl = ssl.verify;

    const sslAgentOpts: AgentOptions = {
      ca: ssl.ca,
      cert: ssl.cert,
      key: ssl.key,
    };

    if (values(sslAgentOpts).filter(Boolean).length) {
      sslAgentOpts.rejectUnauthorized = this.verifySsl == null ? true : this.verifySsl;
      return new HttpsAgent(sslAgentOpts);
    }
  }

  getForParsedUri({
    protocol,
    hostname,
    port,
    pathname,
  }: Record<'protocol' | 'hostname' | 'port' | 'pathname', string>) {
    let match = this.matchers.protocol.match(protocol.slice(0, -1));
    match = match && this.matchers.host.match(hostname);
    match = match && this.matchers.port.match(port);
    match = match && this.matchers.path.match(pathname);

    if (!match) return {};
    return {
      timeout: this.timeout,
      rejectUnauthorized: this.sslAgent ? undefined : this.verifySsl,
      agent: protocol === 'https:' ? this.sslAgent : undefined,
    };
  }
}
