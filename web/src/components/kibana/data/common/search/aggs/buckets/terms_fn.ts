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

const fnName = 'aggTerms';

type Input = any;
type AggArgs = AggExpressionFunctionArgs<typeof BUCKET_TYPES.TERMS>;

// Since the orderAgg param is an agg nested in a subexpression, we need to
// overwrite the param type to expect a value of type AggExpressionType.
type Arguments = Assign<AggArgs, { orderAgg?: AggExpressionType }>;

type Output = AggExpressionType;
type FunctionDefinition = ExpressionFunctionDefinition<typeof fnName, Input, Arguments, Output>;

export const aggTerms = (): FunctionDefinition => ({
  name: fnName,
  help: 'Generates a serialized agg config for a Terms agg',
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
    order: {
      types: ['string'],
      options: ['asc', 'desc'],
      help: 'Order in which to return the results: asc or desc',
    },
    orderBy: {
      types: ['string'],
      help: 'Field to order results by',
    },
    orderAgg: {
      types: ['agg_type'],
      help: 'Agg config to use for ordering results',
    },
    size: {
      types: ['number'],
      help: 'Max number of buckets to retrieve',
    },
    missingBucket: {
      types: ['boolean'],
      help: 'When set to true, groups together any buckets with missing fields',
    },
    missingBucketLabel: {
      types: ['string'],
      help: 'Default label used in charts when documents are missing a field.',
    },
    otherBucket: {
      types: ['boolean'],
      help: 'When set to true, groups together any buckets beyond the allowed size',
    },
    otherBucketLabel: {
      types: ['string'],
      help: 'Default label used in charts for documents in the Other bucket',
    },
    exclude: {
      types: ['string'],
      help: 'Specific bucket values to exclude from results',
    },
    include: {
      types: ['string'],
      help: 'Specific bucket values to include in results',
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
        type: BUCKET_TYPES.TERMS,
        params: {
          ...rest,
          orderAgg: args.orderAgg?.value,
          json: getParsedValue(args, 'json'),
        },
      },
    };
  },
});
