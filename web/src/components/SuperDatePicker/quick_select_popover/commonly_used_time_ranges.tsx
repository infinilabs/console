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

import { EuiFlexGrid, EuiFlexItem, EuiHorizontalRule, EuiI18n, EuiLink, EuiLoadingSpinner, EuiTitle, htmlIdGenerator } from '@elastic/eui';
import { ApplyTime, DurationRange } from '@elastic/eui/src/components/date_picker/types';
import React, { FunctionComponent } from 'react';

const generateId = htmlIdGenerator();

export interface EuiCommonlyUsedTimeRangesProps {
  applyTime: ApplyTime;
  commonlyUsedRanges: DurationRange[];
  timeExtends: any;
}

export const EuiCommonlyUsedTimeRanges: FunctionComponent<EuiCommonlyUsedTimeRangesProps> = ({
  applyTime,
  commonlyUsedRanges,
  timeExtends,
}) => {
  const { showTimeTips = true, timeTipsLoading, onTimeTipsSelect } = timeExtends
  const legendId = generateId();
  const links = commonlyUsedRanges.map(({ start, end, label }) => {
    const applyCommonlyUsed = () => {
      applyTime({ start, end });
    };
    const dataTestSubj = label
      ? `superDatePickerCommonlyUsed_${label.replace(' ', '_')}`
      : undefined;
    return (
      <EuiFlexItem
        key={label}
        component="li"
        className="euiQuickSelectPopover__sectionItem">
        <EuiLink onClick={applyCommonlyUsed} data-test-subj={dataTestSubj}>
          {label}
        </EuiLink>
      </EuiFlexItem>
    );
  });

  const timeTips = (
    <EuiFlexItem
      key={'autoFit'}
      component="li"
      className="euiQuickSelectPopover__sectionItem">
      <EuiLink disabled={timeTipsLoading} onClick={onTimeTipsSelect} data-test-subj={'superDatePickerCommonlyUsed_auto_fit'}>
        Auto fit
        { timeTipsLoading && <EuiLoadingSpinner size="s" />}
      </EuiLink>
    </EuiFlexItem>
  );

  return (
    <fieldset>
      <EuiTitle size="xxxs">
        <legend id={legendId}>
          <EuiI18n
            token="euiCommonlyUsedTimeRanges.legend"
            default="Commonly used"
          />
        </legend>
      </EuiTitle>
      <div className="euiQuickSelectPopover__section">
        <EuiFlexGrid
          aria-labelledby={legendId}
          gutterSize="s"
          columns={2}
          direction="column"
          responsive={false}
          component="ul">
          {showTimeTips ? [timeTips].concat(links) : links}
        </EuiFlexGrid>
      </div>
      <EuiHorizontalRule margin="s" />
    </fieldset>
  );
};

EuiCommonlyUsedTimeRanges.displayName = 'EuiCommonlyUsedTimeRanges';
