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

import {
  TypeAutocompleteComponent,
  IdAutocompleteComponent,
  IndexAutocompleteComponent,
  FieldAutocompleteComponent,
  ListComponent,
  TemplateAutocompleteComponent,
  UsernameAutocompleteComponent,
} from '../autocomplete/components';
import { SpecDefinitionsService } from '../../server/services/spec_definitions_service';

import $ from 'jquery';
import _ from 'lodash';

import Api from './api';

let ACTIVE_API = new Api();
const isNotAnIndexName = (name) => name[0] === '_' && name !== '_all';

const idAutocompleteComponentFactory = (name, parent) => {
  return new IdAutocompleteComponent(name, parent);
};
const parametrizedComponentFactories = {
  getComponent: function (name, parent, provideDefault) {
    if (this[name]) {
      return this[name];
    } else if (provideDefault) {
      return idAutocompleteComponentFactory;
    }
  },
  index: function (name, parent) {
    if (isNotAnIndexName(name)) return;
    return new IndexAutocompleteComponent(name, parent, false);
  },
  indices: function (name, parent) {
    if (isNotAnIndexName(name)) return;
    return new IndexAutocompleteComponent(name, parent, true);
  },
  type: function (name, parent) {
    return new TypeAutocompleteComponent(name, parent, false);
  },
  types: function (name, parent) {
    return new TypeAutocompleteComponent(name, parent, true);
  },
  id: function (name, parent) {
    return idAutocompleteComponentFactory(name, parent);
  },
  transform_id: function (name, parent) {
    return idAutocompleteComponentFactory(name, parent);
  },
  username: function (name, parent) {
    return new UsernameAutocompleteComponent(name, parent);
  },
  user: function (name, parent) {
    return new UsernameAutocompleteComponent(name, parent);
  },
  template: function (name, parent) {
    return new TemplateAutocompleteComponent(name, parent);
  },
  task_id: function (name, parent) {
    return idAutocompleteComponentFactory(name, parent);
  },
  ids: function (name, parent) {
    return idAutocompleteComponentFactory(name, parent, true);
  },
  fields: function (name, parent) {
    return new FieldAutocompleteComponent(name, parent, true);
  },
  field: function (name, parent) {
    return new FieldAutocompleteComponent(name, parent, false);
  },
  nodes: function (name, parent) {
    return new ListComponent(
      name,
      ['_local', '_master', 'data:true', 'data:false', 'master:true', 'master:false'],
      parent
    );
  },
  node: function (name, parent) {
    return new ListComponent(name, [], parent, false);
  },
};

export function getUnmatchedEndpointComponents() {
  return ACTIVE_API.getUnmatchedEndpointComponents();
}

export function getEndpointDescriptionByEndpoint(endpoint) {
  return ACTIVE_API.getEndpointDescriptionByEndpoint(endpoint);
}

export function getEndpointBodyCompleteComponents(endpoint) {
  const desc = getEndpointDescriptionByEndpoint(endpoint);
  if (!desc) {
    throw new Error("failed to resolve endpoint ['" + endpoint + "']");
  }
  return desc.bodyAutocompleteRootComponents;
}

export function getTopLevelUrlCompleteComponents(method) {
  return ACTIVE_API.getTopLevelUrlCompleteComponents(method);
}

export function getGlobalAutocompleteComponents(term, throwOnMissing) {
  return ACTIVE_API.getGlobalAutocompleteComponents(term, throwOnMissing);
}

function loadApisFromJson(
  json,
  urlParametrizedComponentFactories,
  bodyParametrizedComponentFactories
) {
  urlParametrizedComponentFactories =
    urlParametrizedComponentFactories || parametrizedComponentFactories;
  bodyParametrizedComponentFactories =
    bodyParametrizedComponentFactories || urlParametrizedComponentFactories;
  const api = new Api(urlParametrizedComponentFactories, bodyParametrizedComponentFactories);
  const names = [];
  _.each(json, function (apiJson, name) {
    names.unshift(name);
    _.each(apiJson.globals || {}, function (globalJson, globalName) {
      api.addGlobalAutocompleteRules(globalName, globalJson);
    });
    _.each(apiJson.endpoints || {}, function (endpointJson, endpointName) {
      api.addEndpointDescription(endpointName, endpointJson);
    });
  });
  api.name = names.join(',');
  return api;
}

const specDefinitionsService = new SpecDefinitionsService();
specDefinitionsService.start();
const json = specDefinitionsService.asJson();
ACTIVE_API = loadApisFromJson({ es: json });
