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

export function getFieldTypeName(type: string) {
  switch (type) {
    case 'boolean':
      return 'Boolean field';
    case 'conflict':
      return 'Conflicting field';
    case 'date':
      return 'Date field';
    case 'geo_point':
      return 'Geo point field';
    case 'geo_shape':
      return 'Geo shape field';
    case 'ip':
      return 'IP address field';
    case 'murmur3':
      return 'Murmur3 field';
    case 'number':
      return 'Number field';
    case 'source':
      // Note that this type is currently not provided, type for _source is undefined
      return 'Source field';
    case 'string':
      return 'String field';
    case 'nested':
      return 'Nested field';
    default:
      return  'Unknown field';
  }
}
