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

import _, { merge } from 'lodash';

import { jsSpecLoaders } from '../lib';

interface EndpointDescription {
  methods?: string[];
  patterns?: string | string[];
  url_params?: Record<string, unknown>;
  data_autocomplete_rules?: Record<string, unknown>;
  url_components?: Record<string, unknown>;
  priority?: number;
}

export class SpecDefinitionsService {
  private readonly name = 'es';

  private readonly globalRules: Record<string, any> = {};
  private readonly endpoints: Record<string, any> = {};
  private readonly extensionSpecFilePaths: string[] = [];

  private hasLoadedSpec = false;

  public addGlobalAutocompleteRules(parentNode: string, rules: unknown) {
    this.globalRules[parentNode] = rules;
  }

  public addEndpointDescription(endpoint: string, description: EndpointDescription = {}) {
    let copiedDescription: { patterns?: string; url_params?: Record<string, unknown> } = {};
    if (this.endpoints[endpoint]) {
      copiedDescription = { ...this.endpoints[endpoint] };
    }
    let urlParamsDef:
      | {
          ignore_unavailable?: string;
          allow_no_indices?: string;
          expand_wildcards?: string[];
        }
      | undefined;

    _.each(description.patterns || [], function (p) {
      if (p.indexOf('{indices}') >= 0) {
        urlParamsDef = urlParamsDef || {};
        urlParamsDef.ignore_unavailable = '__flag__';
        urlParamsDef.allow_no_indices = '__flag__';
        urlParamsDef.expand_wildcards = ['open', 'closed'];
      }
    });

    if (urlParamsDef) {
      description.url_params = _.assign(description.url_params || {}, copiedDescription.url_params);
      _.defaults(description.url_params, urlParamsDef);
    }

    _.assign(copiedDescription, description);
    _.defaults(copiedDescription, {
      id: endpoint,
      patterns: [endpoint],
      methods: ['GET'],
    });

    this.endpoints[endpoint] = copiedDescription;
  }

  public asJson() {
    return {
      name: this.name,
      globals: this.globalRules,
      endpoints: this.endpoints,
    };
  }

  public addExtensionSpecFilePath(path: string) {
    this.extensionSpecFilePaths.push(path);
  }

  public addProcessorDefinition(processor: unknown) {
    if (!this.hasLoadedSpec) {
      throw new Error(
        'Cannot add a processor definition because spec definitions have not loaded!'
      );
    }
    this.endpoints._processor!.data_autocomplete_rules.__one_of.push(processor);
  }

  public setup() {
    return {
      addExtensionSpecFilePath: this.addExtensionSpecFilePath.bind(this),
    };
  }

  public start() {
    if (!this.hasLoadedSpec) {
      this.loadJsonSpec();
      this.loadJSSpec();
      this.hasLoadedSpec = true;
      return {
        addProcessorDefinition: this.addProcessorDefinition.bind(this),
      };
    } else {
      throw new Error('Service has already started!');
    }
  }

  private loadAllSpec(requireContext) {
    return requireContext.keys().reduce((prev, current) => {
      merge(prev, requireContext(current));
      return prev;
    }, {});
  }

  private loadJSONSpecInDir() {
    const generatedSpecs = this.loadAllSpec(require.context('../lib/spec_definitions/json/generated', false, /[^\.]+\.json/));
    const overridedSpecs = this.loadAllSpec(require.context('../lib/spec_definitions/json/overrides', false, /[^\.]+\.json/));
    return merge(generatedSpecs, overridedSpecs);
  }

  private loadJsonSpec() {
    const result = this.loadJSONSpecInDir();

    Object.keys(result).forEach((endpoint) => {
      this.addEndpointDescription(endpoint, result[endpoint]);
    });
  }

  private loadJSSpec() {
    jsSpecLoaders.forEach((addJsSpec) => addJsSpec(this));
  }
}
