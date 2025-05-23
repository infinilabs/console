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

import { noop } from 'lodash';

import { BucketAggType, IBucketAggConfig } from './bucket_agg_type';
import { BUCKET_TYPES } from './bucket_agg_types';
import { KBN_FIELD_TYPES } from '../../../../common';
import { METRIC_TYPES } from '../metrics/metric_agg_types';
import { BaseAggParams } from '../types';

const geotileGridTitle = 'Geotile';

export interface AggParamsGeoTile extends BaseAggParams {
  field: string;
  useGeocentroid?: boolean;
  precision?: number;
}

export const getGeoTitleBucketAgg = () =>
  new BucketAggType({
    name: BUCKET_TYPES.GEOTILE_GRID,
    title: geotileGridTitle,
    params: [
      {
        name: 'field',
        type: 'field',
        filterFieldTypes: KBN_FIELD_TYPES.GEO_POINT,
      },
      {
        name: 'useGeocentroid',
        default: true,
        write: noop,
      },
      {
        name: 'precision',
        default: 0,
      },
    ],
    getRequestAggs(agg) {
      const aggs = [];
      const useGeocentroid = agg.getParam('useGeocentroid');

      aggs.push(agg);

      if (useGeocentroid) {
        const aggConfig = {
          type: METRIC_TYPES.GEO_CENTROID,
          enabled: true,
          params: {
            field: agg.getField(),
          },
        };

        aggs.push(agg.aggConfigs.createAggConfig(aggConfig, { addToAggConfigs: false }));
      }

      return aggs as IBucketAggConfig[];
    },
  });
