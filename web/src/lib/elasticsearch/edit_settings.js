/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { flattenObject } from "@/lib/flatten_object";
import _ from "lodash";
import { compare } from "@/lib/version";

export const readOnlySettings = [
  "index.creation_date",
  "index.number_of_shards",
  "index.provided_name",
  "index.uuid",
  "index.version.created",
  "index.compound_format",
  "index.data_path",
  "index.format",
  "index.number_of_routing_shards",
  "index.sort.field",
  "index.sort.missing",
  "index.sort.mode",
  "index.sort.order",
  "index.routing_partition_size",
  "index.store.type",
];
export const settingsToDisplay = [
  "index.number_of_replicas",
  "index.blocks.read_only_allow_delete",
  "index.codec",
  "index.priority",
  "index.query.default_field",
  "index.refresh_interval",
  "index.write.wait_for_active_shards",
];

//API expects settings in flattened dotted form,
//whereas they come back as nested objects from ES
export function transformSettingsForApi(data, isOpen, version) {
  const { defaults, settings } = data;
  //settings user has actually set
  const flattenedSettings = flattenObject(settings);
  //settings with their defaults
  const flattenedDefaults = flattenObject(defaults);
  const filteredDefaults = _.pick(flattenedDefaults, settingsToDisplay);
  const newSettings = { ...filteredDefaults, ...flattenedSettings };
  readOnlySettings.forEach((e) => delete newSettings[e]);
  //can't change codec on open index
  if (isOpen) {
    delete newSettings["index.codec"];
  }
  if (version) {
    try {
      if (compare(version, "6.0", "<")) {
        delete newSettings["index.query.default_field"];
      }
    } catch (err) {
      console.error(err);
    }
  }
  return newSettings;
}
