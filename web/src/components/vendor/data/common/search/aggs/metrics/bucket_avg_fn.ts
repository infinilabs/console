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
import { AggExpressionType, AggExpressionFunctionArgs, METRIC_TYPES } from '../';
import { getParsedValue } from '../utils/get_parsed_value';

const fnName = 'aggBucketAvg';

type Input = any;
type AggArgs = AggExpressionFunctionArgs<typeof METRIC_TYPES.AVG_BUCKET>;
type Arguments = Assign<
  AggArgs,
  { customBucket?: AggExpressionType; customMetric?: AggExpressionType }
>;
type Output = AggExpressionType;
type FunctionDefinition = ExpressionFunctionDefinition<typeof fnName, Input, Arguments, Output>;

export const aggBucketAvg = (): FunctionDefinition => ({
  name: fnName,
  help: 'Generates a serialized agg config for a Avg Bucket agg',
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
    customBucket: {
      types: ['agg_type'],
      help: 'Agg config to use for building sibling pipeline aggregations',
    },
    customMetric: {
      types: ['agg_type'],
      help: 'Agg config to use for building sibling pipeline aggregations',
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
        type: METRIC_TYPES.AVG_BUCKET,
        params: {
          ...rest,
          customBucket: args.customBucket?.value,
          customMetric: args.customMetric?.value,
          json: getParsedValue(args, 'json'),
        },
      },
    };
  },
});
