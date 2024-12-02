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

import { EuiHorizontalRule, EuiI18n, EuiLink, EuiTitle, htmlIdGenerator } from '@elastic/eui';
import { ApplyTime, DurationRange } from '@elastic/eui/src/components/date_picker/types';
import React, { FunctionComponent } from 'react';
import { prettyDuration } from '../pretty_duration';

const generateId = htmlIdGenerator();

export interface EuiRecentlyUsedProps {
  applyTime: ApplyTime;
  commonlyUsedRanges: DurationRange[];
  dateFormat: string;
  recentlyUsedRanges?: DurationRange[];
}

export const EuiRecentlyUsed: FunctionComponent<EuiRecentlyUsedProps> = ({
  applyTime,
  commonlyUsedRanges,
  dateFormat,
  recentlyUsedRanges = [],
}) => {
  const legendId = generateId();

  if (recentlyUsedRanges.length === 0) {
    return null;
  }

  const links = recentlyUsedRanges.map(({ start, end }) => {
    const applyRecentlyUsed = () => {
      applyTime({ start, end });
    };
    return (
      <li
        className="euiQuickSelectPopover__sectionItem"
        key={`${start}-${end}`}>
        <EuiLink onClick={applyRecentlyUsed}>
          {prettyDuration(start, end, commonlyUsedRanges, dateFormat)}
        </EuiLink>
      </li>
    );
  });

  return (
    <fieldset>
      <EuiTitle size="xxxs">
        <legend id={legendId}>
          <EuiI18n
            token="euiRecentlyUsed.legend"
            default="Recently used date ranges"
          />
        </legend>
      </EuiTitle>
      <div className="euiQuickSelectPopover__section">
        <ul>{links}</ul>
      </div>
      <EuiHorizontalRule margin="s" />
    </fieldset>
  );
};

EuiRecentlyUsed.displayName = 'EuiRecentlyUsed';
