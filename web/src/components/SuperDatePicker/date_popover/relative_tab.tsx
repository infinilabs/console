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

import React, { Component, ChangeEventHandler } from 'react';
import dateMath from '@elastic/datemath';

import { timeUnits } from '../time_units';
import { relativeOptions } from '../relative_options';
import {
  parseRelativeParts,
  toRelativeStringFromParts,
} from '../relative_utils';
import { LocaleSpecifier } from 'moment'; // eslint-disable-line import/named
import { EuiDatePopoverContentProps } from './date_popover_content';
import { EuiFieldNumber, EuiFieldText, EuiFlexGroup, EuiFlexItem, EuiForm, EuiFormLabel, EuiFormRow, EuiI18n, EuiScreenReaderOnly, EuiSelect, EuiSpacer, EuiSwitch, EuiSwitchEvent, htmlIdGenerator, RelativeParts, TimeUnitId, toSentenceCase } from '@elastic/eui';

export interface EuiRelativeTabProps {
  dateFormat: string;
  locale?: LocaleSpecifier;
  value: string;
  onChange: EuiDatePopoverContentProps['onChange'];
  roundUp?: boolean;
  position: 'start' | 'end';
}

interface EuiRelativeTabState
  extends Pick<RelativeParts, 'unit' | 'round' | 'roundUnit'> {
  count: number | undefined;
  sentenceCasedPosition: string;
}

export class EuiRelativeTab extends Component<
  EuiRelativeTabProps,
  EuiRelativeTabState
> {
  state: EuiRelativeTabState = {
    ...parseRelativeParts(this.props.value),
    sentenceCasedPosition: toSentenceCase(this.props.position),
  };

  generateId = htmlIdGenerator();

  onCountChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    const sanitizedValue = parseInt(event.target.value, 10);
    this.setState(
      {
        count: isNaN(sanitizedValue) ? undefined : sanitizedValue,
      },
      this.handleChange
    );
  };

  onUnitChange: ChangeEventHandler<HTMLSelectElement> = (event) => {
    this.setState(
      {
        unit: event.target.value,
      },
      this.handleChange
    );
  };

  onRoundChange = (event: EuiSwitchEvent) => {
    this.setState(
      {
        round: event.target.checked,
      },
      this.handleChange
    );
  };

  handleChange = () => {
    const { count, round, roundUnit, unit } = this.state;
    const { onChange } = this.props;
    if (count === undefined || count < 0) {
      return;
    }
    const date = toRelativeStringFromParts({
      count,
      round,
      roundUnit,
      unit,
    });
    onChange(date);
  };

  render() {
    const { count, unit } = this.state;
    const relativeDateInputNumberDescriptionId = this.generateId();
    const isInvalid = count === undefined || count < 0;
    const parsedValue = dateMath.parse(this.props.value, {
      roundUp: this.props.roundUp,
    });
    const formatedValue =
      isInvalid || !parsedValue || !parsedValue.isValid()
        ? ''
        : parsedValue
            .locale(this.props.locale || 'en')
            .format(this.props.dateFormat);
    return (
      <EuiForm className="euiDatePopoverContent__padded">
        <EuiFlexGroup gutterSize="s" responsive={false}>
          <EuiFlexItem>
            <EuiI18n
              tokens={[
                'euiRelativeTab.numberInputError',
                'euiRelativeTab.numberInputLabel',
              ]}
              defaults={['Must be >= 0', 'Time span amount']}>
              {([numberInputError, numberInputLabel]: string[]) => (
                <EuiFormRow
                  isInvalid={isInvalid}
                  error={isInvalid ? numberInputError : null}>
                  <EuiFieldNumber
                    compressed
                    aria-label={numberInputLabel}
                    aria-describedby={relativeDateInputNumberDescriptionId}
                    data-test-subj={'superDatePickerRelativeDateInputNumber'}
                    value={count}
                    onChange={this.onCountChange}
                    isInvalid={isInvalid}
                  />
                </EuiFormRow>
              )}
            </EuiI18n>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiI18n
              token="euiRelativeTab.unitInputLabel"
              default="Relative time span">
              {(unitInputLabel: string) => (
                <EuiSelect
                  compressed
                  aria-label={unitInputLabel}
                  data-test-subj={
                    'superDatePickerRelativeDateInputUnitSelector'
                  }
                  value={unit}
                  options={relativeOptions}
                  onChange={this.onUnitChange}
                />
              )}
            </EuiI18n>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="m" />
        <EuiI18n
          token="euiRelativeTab.roundingLabel"
          default="Round to the {unit}"
          values={{ unit: timeUnits[unit.substring(0, 1) as TimeUnitId] }}>
          {(roundingLabel: string) => (
            <EuiSwitch
              data-test-subj={'superDatePickerRelativeDateRoundSwitch'}
              label={roundingLabel}
              checked={this.state.round}
              onChange={this.onRoundChange}
            />
          )}
        </EuiI18n>

        <EuiSpacer size="m" />
        <EuiFieldText
          compressed
          value={formatedValue}
          readOnly
          prepend={
            <EuiFormLabel>
              <EuiI18n
                token="euiRelativeTab.relativeDate"
                default="{position} date"
                values={{ position: this.state.sentenceCasedPosition }}
              />
            </EuiFormLabel>
          }
        />
        <EuiScreenReaderOnly>
          <p id={relativeDateInputNumberDescriptionId}>
            <EuiI18n
              token="euiRelativeTab.fullDescription"
              default="The unit is changeable. Currently set to {unit}."
              values={{ unit }}
            />
          </p>
        </EuiScreenReaderOnly>
      </EuiForm>
    );
  }
}
