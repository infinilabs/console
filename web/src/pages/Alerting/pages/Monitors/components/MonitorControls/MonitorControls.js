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
import { EuiFieldSearch, EuiFlexGroup, EuiFlexItem, EuiPagination, EuiSelect } from '@elastic/eui';
import { formatMessage } from 'umi/locale';

const states = [
  { value: 'all', text: formatMessage({ id: 'alert.monitor.state.all' }) },
  { value: 'enabled', text: formatMessage({ id: 'alert.monitor.state.enabled' }) },
  { value: 'disabled', text: formatMessage({ id: 'alert.monitor.state.disabled' }) },
];

const MonitorControls = ({
  activePage,
  pageCount,
  search,
  state,
  onSearchChange,
  onStateChange,
  onPageClick,
}) => (
  <EuiFlexGroup style={{ padding: '0px 5px' }}>
    <EuiFlexItem>
      <EuiFieldSearch
        fullWidth={true}
        value={search}
        placeholder={formatMessage({ id: 'form.button.search' })}
        onChange={onSearchChange}
      />
    </EuiFlexItem>
    <EuiFlexItem grow={false}>
      <EuiSelect options={states} value={state} onChange={onStateChange} />
    </EuiFlexItem>
    <EuiFlexItem grow={false} style={{ justifyContent: 'center' }}>
      <EuiPagination pageCount={pageCount} activePage={activePage} onPageClick={onPageClick} />
    </EuiFlexItem>
  </EuiFlexGroup>
);

export default MonitorControls;
