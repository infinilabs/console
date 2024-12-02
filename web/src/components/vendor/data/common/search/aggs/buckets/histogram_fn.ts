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

import { Assign } from '@kbn/utility-types';
import { ExpressionFunctionDefinition } from 'src/plugins/expressions/common';
import { AggExpressionType, AggExpressionFunctionArgs, BUCKET_TYPES } from '../';
import { getParsedValue } from '../utils/get_parsed_value';

const fnName = 'aggHistogram';

type Input = any;
type AggArgs = AggExpressionFunctionArgs<typeof BUCKET_TYPES.HISTOGRAM>;

type Arguments = Assign<AggArgs, { extended_bounds?: string }>;

type Output = AggExpressionType;
type FunctionDefinition = ExpressionFunctionDefinition<typeof fnName, Input, Arguments, Output>;

export const aggHistogram = (): FunctionDefinition => ({
  name: fnName,
  help: 'Generates a serialized agg config for a Histogram agg',
  type: 'agg_type',
  args: {
    id: {
      types: ['string'],
      help: 'ID for this aggregation',
    },
    enabled: {
      types: ['boolean'],
      default: true,
      help: 'Specifies whether this aggregation should be enabled',
    },
    schema: {
      types: ['string'],
      help: 'Schema to use for this aggregation',
    },
    field: {
      types: ['string'],
      required: true,
      help: 'Field to use for this aggregation',
    },
    interval: {
      types: ['string'],
      required: true,
      help: 'Interval to use for this aggregation',
    },
    intervalBase: {
      types: ['number'],
      help: 'IntervalBase to use for this aggregation',
    },
    min_doc_count: {
      types: ['boolean'],
      help: 'Specifies whether to use min_doc_count for this aggregation',
    },
    maxBars: {
      types: ['number'],
      help: 'Calculate interval to get approximately this many bars',
    },
    has_extended_bounds: {
      types: ['boolean'],
      help: 'Specifies whether to use has_extended_bounds for this aggregation',
    },
    extended_bounds: {
      types: ['string'],
      help:
          'With extended_bounds setting, you now can "force" the histogram aggregation to start building buckets on a specific min value and also keep on building buckets up to a max value ',
    },
    json: {
      types: ['string'],
      help: 'Advanced json to include when the agg is sent to Elasticsearch',
    },
    customLabel: {
      types: ['string'],
      help: 'Represents a custom label for this aggregation',
    },
  },
  fn: (input, args) => {
    const { id, enabled, schema, ...rest } = args;

    return {
      type: 'agg_type',
      value: {
        id,
        enabled,
        schema,
        type: BUCKET_TYPES.HISTOGRAM,
        params: {
          ...rest,
          extended_bounds: getParsedValue(args, 'extended_bounds'),
          json: getParsedValue(args, 'json'),
        },
      },
    };
  },
});
