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

import ace from 'brace';
import { addXJsonToRules } from '../../kbn-ace';

export function addEOL(tokens, reg, nextIfEOL, normalNext) {
  if (typeof reg === 'object') {
    reg = reg.source;
  }
  return [
    { token: tokens.concat(['whitespace']), regex: reg + '(\\s*)$', next: nextIfEOL },
    { token: tokens, regex: reg, next: normalNext },
  ];
}

export function mergeTokens(/* ... */) {
  return [].concat.apply([], arguments);
}

const oop = ace.acequire('ace/lib/oop');
const { TextHighlightRules } = ace.acequire('ace/mode/text_highlight_rules');

export function InputHighlightRules() {
  // regexp must not have capturing parentheses. Use (?:) instead.
  // regexps are ordered -> the first match is used
  /*jshint -W015 */
  const keywords =
    'describe|between|in|like|not|and|or|desc|select|from|where|having|group|by|order|' +
    'asc|desc|pivot|for|in|as|show|columns|include|frozen|tables|escape|limit|rlike|all|distinct|is';

  const builtinConstants = 'true|false';

  // See https://www.elastic.co/guide/en/elasticsearch/reference/current/sql-syntax-show-functions.html
  const builtinFunctions =
    'avg|count|first|first_value|last|last_value|max|min|sum|kurtosis|mad|percentile|percentile_rank|skewness' +
    '|stddev_pop|sum_of_squares|var_pop|histogram|case|coalesce|greatest|ifnull|iif|isnull|least|nullif|nvl' +
    '|curdate|current_date|current_time|current_timestamp|curtime|dateadd|datediff|datepart|datetrunc|date_add' +
    '|date_diff|date_part|date_trunc|day|dayname|dayofmonth|dayofweek|dayofyear|day_name|day_of_month|day_of_week' +
    '|day_of_year|dom|dow|doy|hour|hour_of_day|idow|isodayofweek|isodow|isoweek|isoweekofyear|iso_day_of_week|iso_week_of_year' +
    '|iw|iwoy|minute|minute_of_day|minute_of_hour|month|monthname|month_name|month_of_year|now|quarter|second|second_of_minute' +
    '|timestampadd|timestampdiff|timestamp_add|timestamp_diff|today|week|week_of_year|year|abs|acos|asin|atan|atan2|cbrt' +
    '|ceil|ceiling|cos|cosh|cot|degrees|e|exp|expm1|floor|log|log10|mod|pi|power|radians|rand|random|round|sign|signum|sin' +
    '|sinh|sqrt|tan|truncate|ascii|bit_length|char|character_length|char_length|concat|insert|lcase|left|length|locate' +
    '|ltrim|octet_length|position|repeat|replace|right|rtrim|space|substring|ucase|cast|convert|database|user|st_astext|st_aswkt' +
    '|st_distance|st_geometrytype|st_geomfromtext|st_wkttosql|st_x|st_y|st_z|score';

  // See https://www.elastic.co/guide/en/elasticsearch/reference/current/sql-data-types.html
  const dataTypes =
    'null|boolean|byte|short|integer|long|double|float|half_float|scaled_float|keyword|text|binary|date|ip|object|nested|time' +
    '|interval_year|interval_month|interval_day|interval_hour|interval_minute|interval_second|interval_year_to_month' +
    'inteval_day_to_hour|interval_day_to_minute|interval_day_to_second|interval_hour_to_minute|interval_hour_to_second' +
    'interval_minute_to_second|geo_point|geo_shape|shape';

    const keywordMapper = this.createKeywordMapper(
      {
        keyword: [keywords, builtinFunctions, builtinConstants, dataTypes].join('|'),
      },
      'identifier',
      true
    );
  const keywordArr = [keywords, builtinFunctions, builtinConstants, dataTypes].join('|').split("|");
  let partRules = addEOL(['url.part'], /([^?\/,\s]+)/, 'start');
  partRules = partRules.map(rule=>{
    rule.onMatch = (value, currentState, stack)=>{
      if(keywordArr.includes(value?.toLowerCase())){
        return "url.select_keyword";
      }
      return rule.token;
    }
    return rule;
  });
  this.$rules = {
    'start-sql': [
      { token: 'whitespace', regex: '\\s+' },
      { token: 'paren.lparen', regex: '{', next: 'json-sql', push: true },
      { regex: '', next: 'start' },
    ],
    start: mergeTokens(
      [
        { token: 'warning', regex: '#!.*$' },
        { token: 'comment', regex: /^#.*$/ },
        { token: 'paren.lparen', regex: '{', next: 'json', push: true },
      ],
      // addEOL(['method'], /(SELECT)/, 'start', 'select-sql'),
      addEOL(['method'], /([a-zA-Z]+)/, 'start', 'method_sep'),
      [
        {
          token: 'whitespace',
          regex: '\\s+',
        },
        {
          token: 'text',
          regex: '.+?',
        },
      ],
    ),
    method_sep: mergeTokens(
      addEOL(
        ['whitespace', 'url.protocol_host', 'url.slash'],
        /(\s+)(https?:\/\/[^?\/,]+)(\/)/,
        'start',
        'url'
      ),
      addEOL(['whitespace', 'url.protocol_host'], /(\s+)(https?:\/\/[^?\/,]+)/, 'start', 'url'),
      addEOL(['whitespace', 'url.slash'], /(\s+)(\/)/, 'start', 'url'),
      addEOL(['whitespace'], /(\s+)/, 'start', 'url')
    ),
    url: mergeTokens(
      addEOL(['url.part'], /(_sql)/, 'start-sql', 'url-sql'),
      // addEOL(['url.part'], /([^?\/,\s]+)/, 'start'),
      partRules,
      addEOL(['url.comma'], /(,)/, 'start'),
      addEOL(['url.slash'], /(\/)/, 'start'),
      addEOL(['url.questionmark'], /(\?)/, 'start', 'urlParams')
    ),
    urlParams: mergeTokens(
      addEOL(['url.param', 'url.equal', 'url.value'], /([^&=]+)(=)([^&]*)/, 'start'),
      addEOL(['url.param'], /([^&=]+)/, 'start'),
      addEOL(['url.amp'], /(&)/, 'start')
    ),
    'url-sql': mergeTokens(
      addEOL(['url.part'], /([^?\/,\s]+)/, 'start-sql'),
      addEOL(['url.comma'], /(,)/, 'start-sql'),
      addEOL(['url.slash'], /(\/)/, 'start-sql'),
      addEOL(['url.questionmark'], /(\?)/, 'start-sql', 'urlParams-sql')
    ),
    'urlParams-sql': mergeTokens(
      addEOL(['url.param', 'url.equal', 'url.value'], /([^&=]+)(=)([^&]*)/, 'start-sql'),
      addEOL(['url.param'], /([^&=]+)/, 'start-sql'),
      addEOL(['url.amp'], /(&)/, 'start-sql')
    ),
  };

  addXJsonToRules(this);

  if (this.constructor === InputHighlightRules) {
    this.normalizeRules();
  }
}

oop.inherits(InputHighlightRules, TextHighlightRules);
