/*
 *   Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *   Licensed under the Apache License, Version 2.0 (the "License").
 *   You may not use this file except in compliance with the License.
 *   A copy of the License is located at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   or in the "license" file accompanying this file. This file is distributed
 *   on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 *   express or implied. See the License for the specific language governing
 *   permissions and limitations under the License.
 */

import React from 'react';
import { EuiButton, EuiEmptyPrompt, EuiText } from '@elastic/eui';

import { APP_PATH } from '../../../../utils/constants';
import { PLUGIN_NAME } from '../../../../utils/constants';
import { formatMessage } from 'umi/locale';

const filterText = formatMessage({ id: 'alert.monitor.filter-text' });
const emptyMonitorText = formatMessage({ id: 'alert.monitor.empty-monitor-text' });
const loadingText = formatMessage({ id: 'alert.monitor.loading-monitors' });
const createMonitorButton = (
  <EuiButton fill href={`#/${PLUGIN_NAME}${APP_PATH.CREATE_MONITOR}`}>
      {formatMessage({ id: 'alert.button.create-monitor' })}
  </EuiButton>
);
const resetFiltersButton = resetFilters => (
  <EuiButton fill onClick={resetFilters}>
      {formatMessage({ id: 'reset-filters' })}
  </EuiButton>
);

const getMessagePrompt = ({ filterIsApplied, loading }) => {
  if (loading) return loadingText;
  if (filterIsApplied) return filterText;
  return emptyMonitorText;
};

const getActions = ({ filterIsApplied, loading, resetFilters }) => {
  if (loading) return null;
  if (filterIsApplied) return resetFiltersButton(resetFilters);
  return createMonitorButton;
};

const MonitorEmptyPrompt = props => (
  <EuiEmptyPrompt
    style={{ maxWidth: '45em' }}
    body={
      <EuiText>
        <p>{getMessagePrompt(props)}</p>
      </EuiText>
    }
    actions={getActions(props)}
  />
);

export default MonitorEmptyPrompt;
