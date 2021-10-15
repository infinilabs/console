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

import $ from 'jquery';
import _ from 'lodash';
import * as es from '../es';

// NOTE: If this value ever changes to be a few seconds or less, it might introduce flakiness
// due to timing issues in our app.js tests.
const POLL_INTERVAL = 60000;
let pollTimeoutId;

let perIndexTypes = {};
let perAliasIndexes = {};
let templates = {};
//new add
let commands = [];
const mappingObj = {};
let clusterID = '';

export function expandAliases(indicesOrAliases, clusterID) {
  const clusterPerAliasIndexes = perAliasIndexes[clusterID] || {};
  // takes a list of indices or aliases or a string which may be either and returns a list of indices
  // returns a list for multiple values or a string for a single.

  if (!indicesOrAliases) {
    return indicesOrAliases;
  }

  if (typeof indicesOrAliases === 'string') {
    indicesOrAliases = [indicesOrAliases];
  }
  indicesOrAliases = $.map(indicesOrAliases, function (iOrA) {
    if (clusterPerAliasIndexes[iOrA]) {
      return clusterPerAliasIndexes[iOrA];
    }
    return [iOrA];
  });
  let ret = [].concat.apply([], indicesOrAliases);
  ret.sort();
  let last;
  ret = $.map(ret, function (v) {
    const r = last === v ? null : v;
    last = v;
    return r;
  });
  return ret.length > 1 ? ret : ret[0];
}

export function getTemplates(key) {
  key = key.editor.editor.clusterID || clusterID;
  const clusterTemplates = templates[key] || [];
  return [...clusterTemplates];
}

export function getFields(indices, types, key) {
  key = key || clusterID
  const clusterPerIndexTypes = perIndexTypes[key] || {}; 
  // get fields for indices and types. Both can be a list, a string or null (meaning all).
  let ret = [];
  indices = expandAliases(indices, key);

  if (typeof indices === 'string') {
    const typeDict = clusterPerIndexTypes[indices];
    if (!typeDict) {
      return [];
    }

    if (typeof types === 'string') {
      const f = typeDict[types];
      ret = f ? f : [];
    } else {
      // filter what we need
      $.each(typeDict, function (type, fields) {
        if (!types || types.length === 0 || $.inArray(type, types) !== -1) {
          ret.push(fields);
        }
      });

      ret = [].concat.apply([], ret);
    }
  } else {
    // multi index mode.
    $.each(clusterPerIndexTypes, function (index) {
      if (!indices || indices.length === 0 || $.inArray(index, indices) !== -1) {
        ret.push(getFields(index, types, key));
      }
    });
    ret = [].concat.apply([], ret);
  }

  return _.uniqBy(ret, function (f) {
    return f.name + ':' + f.type;
  });
}

export function getTypes(indices, clusterID) {
  const clusterPerIndexTypes = perIndexTypes[clusterID] || {}; 
  let ret = [];
  indices = expandAliases(indices, clusterID);
  if (typeof indices === 'string') {
    const typeDict = clusterPerIndexTypes[indices];
    if (!typeDict) {
      return [];
    }

    // filter what we need
    $.each(typeDict, function (type) {
      ret.push(type);
    });
  } else {
    // multi index mode.
    $.each(clusterPerIndexTypes, function (index) {
      if (!indices || $.inArray(index, indices) !== -1) {
        ret.push(getTypes(index, clusterID));
      }
    });
    ret = [].concat.apply([], ret);
  }

  return _.uniq(ret);
}

export function getIndices(includeAliases, key) {
  if(typeof key != 'string') {
    key = key?.editor?.clusterID || clusterID
  }
  const clusterPerIndexTypes = perIndexTypes[key] || {};
  const clusterPerAliasIndexes = perAliasIndexes[key] || [];
  const ret = [];
  $.each(clusterPerIndexTypes, function (index) {
    ret.push(index);
  });
  if (typeof includeAliases === 'undefined' ? true : includeAliases) {
    $.each(clusterPerAliasIndexes, function (alias) {
      ret.push(alias);
    });
  }
  return ret;
}

function getFieldNamesFromFieldMapping(fieldName, fieldMapping) {
  if (fieldMapping.enabled === false) {
    return [];
  }
  let nestedFields;

  function applyPathSettings(nestedFieldNames) {
    const pathType = fieldMapping.path || 'full';
    if (pathType === 'full') {
      return $.map(nestedFieldNames, function (f) {
        f.name = fieldName + '.' + f.name;
        return f;
      });
    }
    return nestedFieldNames;
  }

  if (fieldMapping.properties) {
    // derived object type
    nestedFields = getFieldNamesFromProperties(fieldMapping.properties);
    return applyPathSettings(nestedFields);
  }

  const fieldType = fieldMapping.type;

  const ret = { name: fieldName, type: fieldType };

  if (fieldMapping.index_name) {
    ret.name = fieldMapping.index_name;
  }

  if (fieldMapping.fields) {
    nestedFields = $.map(fieldMapping.fields, function (fieldMapping, fieldName) {
      return getFieldNamesFromFieldMapping(fieldName, fieldMapping);
    });
    nestedFields = applyPathSettings(nestedFields);
    nestedFields.unshift(ret);
    return nestedFields;
  }

  return [ret];
}

function getFieldNamesFromProperties(properties = {}) {
  const fieldList = $.map(properties, function (fieldMapping, fieldName) {
    return getFieldNamesFromFieldMapping(fieldName, fieldMapping);
  });

  // deduping
  return _.uniqBy(fieldList, function (f) {
    return f.name + ':' + f.type;
  });
}

function loadTemplates(templatesObject = {}, clusterID) {
  templates[clusterID] = Object.keys(templatesObject);
}

export function loadMappings(mappings, clusterID) {
  let clusterPerIndexTypes = {};

  $.each(mappings, function (index, indexMapping) {
    const normalizedIndexMappings = {};

    // Migrate 1.0.0 mappings. This format has changed, so we need to extract the underlying mapping.
    if (indexMapping.mappings && _.keys(indexMapping).length === 1) {
      indexMapping = indexMapping.mappings;
    }

    $.each(indexMapping, function (typeName, typeMapping) {
      if (typeName === 'properties') {
        const fieldList = getFieldNamesFromProperties(typeMapping);
        normalizedIndexMappings[typeName] = fieldList;
      } else {
        normalizedIndexMappings[typeName] = [];
      }
    });
    clusterPerIndexTypes[index] = normalizedIndexMappings;
  });
  perIndexTypes[clusterID] = clusterPerIndexTypes;
}

export function loadAliases(aliases, clusterID) {
  let clusterPerAliasIndexes = {};
  $.each(aliases || {}, function (index, omdexAliases) {
    // verify we have an index defined. useful when mapping loading is disabled
    // clusterPerAliasIndexes[index] = clusterPerAliasIndexes[index] || {};

    $.each(omdexAliases.aliases || {}, function (alias) {
      if (alias === index) {
        return;
      } // alias which is identical to index means no index.
      
      let curAliases = clusterPerAliasIndexes[alias];
      if (!curAliases) {
        curAliases = [];
        clusterPerAliasIndexes[alias] = curAliases;
      }
      curAliases.push(index);
    });
  });
  clusterPerAliasIndexes._all = getIndices(false, clusterID);
  perAliasIndexes[clusterID] = clusterPerAliasIndexes;
}

export function clear() {
  perIndexTypes = {};
  perAliasIndexes = {};
  templates = [];
}

function retrieveSettings(settingsKey, settingsToRetrieve, clusterID) {
  const settingKeyToPathMap = {
    fields: '_mapping',
    indices: '_aliases',
    templates: '_template',
    commands: 'commands/_search',
  };

  // Fetch autocomplete info if setting is set to true, and if user has made changes.
  if (settingsToRetrieve[settingsKey] === true) {
    if(settingsKey === 'commands'){
      return es.queryCommonCommands();
    }
    return es.send('GET', settingKeyToPathMap[settingsKey], null, {clusterID, asSystemRequest: true});
  } else {
    const settingsPromise = new $.Deferred();
    if (settingsToRetrieve[settingsKey] === false) {
      // If the user doesn't want autocomplete suggestions, then clear any that exist
      return settingsPromise.resolveWith(this, [[JSON.stringify({})]]);
    } else {
      // If the user doesn't want autocomplete suggestions, then clear any that exist
      return settingsPromise.resolve();
    }
  }
}

// Retrieve all selected settings by default.
// TODO: We should refactor this to be easier to consume. Ideally this function should retrieve
// whatever settings are specified, otherwise just use the saved settings. This requires changing
// the behavior to not *clear* whatever settings have been unselected, but it's hard to tell if
// this is possible without altering the autocomplete behavior. These are the scenarios we need to
// support:
//   1. Manual refresh. Specify what we want. Fetch specified, leave unspecified alone.
//   2. Changed selection and saved: Specify what we want. Fetch changed and selected, leave
//      unchanged alone (both selected and unselected).
//   3. Poll: Use saved. Fetch selected. Ignore unselected.

export function clearSubscriptions() {
  if (pollTimeoutId) {
    clearTimeout(pollTimeoutId);
  }
}

function getObject(value){
  return typeof(value) === 'string' ? JSON.parse(value): value;
}

/**
 *
 * @param settings Settings A way to retrieve the current settings
 * @param settingsToRetrieve any
 */
export function retrieveAutoCompleteInfo(settings, settingsToRetrieve, clusterID) {
  clearSubscriptions();

  const mappingPromise = retrieveSettings('fields', settingsToRetrieve, clusterID);
  const aliasesPromise = retrieveSettings('indices', settingsToRetrieve, clusterID);
  const templatesPromise = retrieveSettings('templates', settingsToRetrieve, clusterID);
  const commandsPromise = retrieveSettings('commands', settingsToRetrieve, clusterID);


  $.when(mappingPromise, aliasesPromise, templatesPromise, commandsPromise).done((mappings, aliases, templates, commands) => {
    if(commands){
      loadCommands(commands);
    }
    let mappingsResponse;
    if (mappings) {
      const maxMappingSize = mappings[0].length > 10 * 1024 * 1024;
      if (maxMappingSize) {
        console.warn(
          `Mapping size is larger than 10MB (${mappings[0].length / 1024 / 1024} MB). Ignoring...`
        );
        mappingsResponse = '[{}]';
      } else {
        mappingsResponse = mappings[0];
      }
      loadMappings(getObject(mappingsResponse), clusterID); //
    }

    if (aliases) {
      loadAliases(getObject(aliases[0]), clusterID);
    }

    if (templates) {
      loadTemplates(getObject(templates[0]), clusterID);
    }

    if (mappings && aliases) {
      // Trigger an update event with the mappings, aliases
      $(mappingObj).trigger('update', [mappingsResponse, aliases[0]]);
    }

    // Schedule next request.
    pollTimeoutId = setTimeout(() => {
      // This looks strange/inefficient, but it ensures correct behavior because we don't want to send
      // a scheduled request if the user turns off polling.
      if (settings.getPolling()) {
        retrieveAutoCompleteInfo(settings, settings.getAutocomplete());
      }
    }, POLL_INTERVAL);
  });
}

async function loadCommands(commandsPromise){
  const commandRes = await commandsPromise.json();
  const hits = commandRes.hits.hits;
  if(hits && hits.length > 0){
    hits.forEach((hit)=>{
      commands.push(hit);
    })
  }
}

export function pushCommand(cmd) {
  commands.push(cmd);
}

export function getCommands({editor}) {
  const ret = [];
  commands.forEach(command=>{
    ret.push(command._source['title']);
  });
  return ret;
  // const curPosition = editor.getCurrentPosition();
  // const token = editor.getTokenAt(curPosition);
  // const commandsPromise = await es.queryCommonCommands(token.value);
  // const commandRes = await commandsPromise.json();
  // const hits = commandRes.hits.hits;
  // const ret = [];
  // if(hits && hits.length > 0){
  //   hits.forEach((hit)=>{
  //     ret.push(hit._source['title']);
  //   })
  // }
  // console.log(ret)
  // return ret;
}

export function getCommand(title) {
  const command = commands.filter(c=>{
    return c._source['title'] == title;
  })
  return command && command[0];
}

export function setClusterID(id) {
  clusterID = id;
}