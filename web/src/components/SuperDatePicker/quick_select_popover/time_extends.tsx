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

import React, {
  Component,
} from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiHorizontalRule, EuiIconTip, EuiSelect, EuiTitle } from '@elastic/eui';

export interface EuiTimeExtendsProps {
  timeFields: string[];
  timeField: string;
  onTimeFieldChange: (timeField: string) => void;
  bucketInterval: any;
  options: { val: string, display: string} [];
  stateInterval: any;
  onIntervalChange: any;
  intervalOptions: { val: string, display: string} [];
  showInterval: boolean;
}

export class EuiTimeExtends extends Component<
  EuiTimeExtendsProps,
  {}
> {
  constructor(props: EuiTimeExtendsProps) {
    super(props);
  }

  render() {
    const { 
      timeFields, 
      timeField, 
      onTimeFieldChange,
      bucketInterval = {},
      options = [],
      onIntervalChange,
      stateInterval,
      intervalOptions = [],
      showInterval,
    } = this.props;

    return (
      <fieldset>
        <EuiFlexGroup
          responsive={false}
          alignItems="center"
          justifyContent="spaceBetween"
          gutterSize="l">
          <EuiFlexItem>
            <EuiTitle size="xxxs">
              <div>Time field</div>
            </EuiTitle>
            <EuiSelect
              compressed
              hasNoInitialSelection={true}
              aria-label={'Time field'}
              value={timeField}
              options={timeFields.map((item) => ({ value: item, text: item}))}
              onChange={(e) => onTimeFieldChange(e.target.value)}
            />
          </EuiFlexItem>
          {
            timeField && showInterval && (
              <EuiFlexItem>
                <EuiTitle size="xxxs">
                  <div>Time interval</div>
                </EuiTitle>
                <EuiSelect
                    aria-label={"Time interval"}
                    compressed
                    hasNoInitialSelection={true}
                    options={intervalOptions.filter(({ val }) => val !== "custom").map(({ display, val }) => {
                      return {
                        text: display,
                        value: val,
                        label: display,
                      };
                    })}
                    value={stateInterval || undefined}
                    onChange={(e) => onIntervalChange(e.target.value)}
                    append={
                      bucketInterval.scaled ? (
                        <EuiIconTip
                          id="discoverIntervalIconTip"
                          content={`This interval creates ${
                            bucketInterval?.scale && bucketInterval?.scale > 1
                              ? "buckets that are too large"
                              : "too many buckets"
                          } to show in the selected time range, so it has been scaled to ${
                            bucketInterval.description
                          }.`}
                          color="warning"
                          size="s"
                          type="alert"
                        />
                      ) : (
                        undefined
                      )
                    }
                  />
              </EuiFlexItem>
            )
          }
        </EuiFlexGroup>
        <EuiHorizontalRule margin="s" />
      </fieldset>
    );
  }
}
