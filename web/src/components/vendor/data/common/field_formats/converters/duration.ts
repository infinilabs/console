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

import moment, { unitOfTime, Duration } from 'moment';
import { KBN_FIELD_TYPES } from '../../kbn_field_types/types';
import { FieldFormat } from '../field_format';
import { TextContextTypeConvert, FIELD_FORMAT_IDS } from '../types';

const ratioToSeconds: Record<string, number> = {
  picoseconds: 0.000000000001,
  nanoseconds: 0.000000001,
  microseconds: 0.000001,
};
const HUMAN_FRIENDLY = 'humanize';
const DEFAULT_OUTPUT_PRECISION = 2;
const DEFAULT_INPUT_FORMAT = {
  text: 'Seconds',
  kind: 'seconds',
};
const inputFormats = [
  {
    text: 'Picoseconds',
    kind: 'picoseconds',
  },
  {
    text: 'Nanoseconds',
    kind: 'nanoseconds',
  },
  {
    text: 'Microseconds',
    kind: 'microseconds',
  },
  {
    text: 'Milliseconds',
    kind: 'milliseconds',
  },
  { ...DEFAULT_INPUT_FORMAT },
  {
    text: 'Minutes',
    kind: 'minutes',
  },
  {
    text:  'Hours',
    kind: 'hours',
  },
  {
    text: 'Days',
    kind: 'days',
  },
  {
    text: 'Weeks',
    kind: 'weeks',
  },
  {
    text: 'Months',
    kind: 'months',
  },
  {
    text: 'Years',
    kind: 'years',
  },
];
const DEFAULT_OUTPUT_FORMAT = {
  text: 'Human Readable',
  method: 'humanize',
};
const outputFormats = [
  { ...DEFAULT_OUTPUT_FORMAT },
  {
    text: 'Milliseconds',
    method: 'asMilliseconds',
  },
  {
    text: 'Seconds',
    method: 'asSeconds',
  },
  {
    text: 'Minutes',
    method: 'asMinutes',
  },
  {
    text: 'Hours',
    method: 'asHours',
  },
  {
    text: 'Days',
    method: 'asDays',
  },
  {
    text: 'Weeks',
    method: 'asWeeks',
  },
  {
    text: 'Months',
    method: 'asMonths',
  },
  {
    text: 'Years',
    method: 'asYears',
  },
];

function parseInputAsDuration(val: number, inputFormat: string) {
  const ratio = ratioToSeconds[inputFormat] || 1;
  const kind = (inputFormat in ratioToSeconds
    ? 'seconds'
    : inputFormat) as unitOfTime.DurationConstructor;
  return moment.duration(val * ratio, kind);
}

export class DurationFormat extends FieldFormat {
  static id = FIELD_FORMAT_IDS.DURATION;
  static title = 'Duration';
  static fieldType = KBN_FIELD_TYPES.NUMBER;
  static inputFormats = inputFormats;
  static outputFormats = outputFormats;
  allowsNumericalAggregations = true;

  isHuman() {
    return this.param('outputFormat') === HUMAN_FRIENDLY;
  }
  getParamDefaults() {
    return {
      inputFormat: DEFAULT_INPUT_FORMAT.kind,
      outputFormat: DEFAULT_OUTPUT_FORMAT.method,
      outputPrecision: DEFAULT_OUTPUT_PRECISION,
    };
  }

  textConvert: TextContextTypeConvert = (val) => {
    const inputFormat = this.param('inputFormat');
    const outputFormat = this.param('outputFormat') as keyof Duration;
    const outputPrecision = this.param('outputPrecision');
    const showSuffix = Boolean(this.param('showSuffix'));
    const human = this.isHuman();
    const prefix =
      val < 0 && human
        ? 'minus' + ' '
        : '';
    const duration = parseInputAsDuration(val, inputFormat) as Record<keyof Duration, Function>;
    const formatted = duration[outputFormat]();
    const precise = human ? formatted : formatted.toFixed(outputPrecision);
    const type = outputFormats.find(({ method }) => method === outputFormat);
    const suffix = showSuffix && type ? ` ${type.text}` : '';

    return prefix + precise + suffix;
  };
}
