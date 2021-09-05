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
import _ from 'lodash';
import { EuiLink } from '@elastic/eui';
import moment from 'moment';

import { ALERT_STATE, DEFAULT_EMPTY_DATA } from '../../../utils/constants';
import { PLUGIN_NAME } from '../../../utils/constants';
import { formatMessage } from 'umi/locale';

const renderTime = (time) => {
  const momentTime = moment(time);
  if (time && momentTime.isValid()) return momentTime.format('MM/DD/YY h:mm a');
  return DEFAULT_EMPTY_DATA;
};

export const columns = [
  {
    field: 'start_time',
    name: formatMessage({ id: 'alert.dashboard.table.columns.start_time' }),
    sortable: true,
    truncateText: false,
    render: renderTime,
    dataType: 'date',
  },
  {
    field: 'end_time',
    name: formatMessage({ id: 'alert.dashboard.table.columns.end_time' }),
    sortable: true,
    truncateText: false,
    render: renderTime,
    dataType: 'date',
  },
  {
    field: 'monitor_name',
    name: formatMessage({ id: 'alert.dashboard.table.columns.monitor_name' }),
    sortable: true,
    truncateText: true,
    textOnly: true,
    render: (name, alert) => (
      <EuiLink href={`${PLUGIN_NAME}#/monitors/${alert.monitor_id}`}>{name}</EuiLink>
    ),
  },
  {
    field: 'trigger_name',
    name: formatMessage({ id: 'alert.dashboard.table.columns.trigger_name' }),
    sortable: true,
    truncateText: true,
    textOnly: true,
  },
  {
    field: 'severity',
    name: formatMessage({ id: 'alert.dashboard.table.columns.severity' }),
    sortable: false,
    truncateText: false,
  },
  {
    field: 'state',
    name: formatMessage({ id: 'alert.dashboard.table.columns.state' }),
    sortable: false,
    truncateText: false,
    render: (state, alert) => {
      const stateText =
        typeof state !== 'string' ? DEFAULT_EMPTY_DATA : _.capitalize(state.toLowerCase());
      return state === ALERT_STATE.ERROR ? `${stateText}: ${alert.error_message}` : stateText;
    },
  },
  {
    field: 'acknowledged_time',
    name: formatMessage({ id: 'alert.dashboard.table.columns.acknowledged_time' }),
    sortable: true,
    truncateText: false,
    render: renderTime,
    dataType: 'date',
  },
];
