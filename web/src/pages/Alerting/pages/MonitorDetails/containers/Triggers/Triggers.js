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

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import uuid from 'uuid-v4';
import { EuiButton, EuiInMemoryTable } from '@elastic/eui';

import ContentPanel from '../../../../components/ContentPanel';
import {formatMessage} from 'umi/locale';

const MAX_TRIGGERS = 10;

export default class Triggers extends Component {
  constructor(props) {
    super(props);

    this.state = {
      field: 'name',
      tableKey: uuid(),
      direction: 'asc',
      selectedItems: [],
    };

    this.onDelete = this.onDelete.bind(this);
    this.onEdit = this.onEdit.bind(this);
    this.onSelectionChange = this.onSelectionChange.bind(this);
    this.onTableChange = this.onTableChange.bind(this);
  }

  componentWillReceiveProps(nextProps, nextContext) {
    if (this.props.monitor !== nextProps.monitor) {
      // In the React version Kibana uses there is a bug regarding getDerivedStateFromProps
      // which EuiInMemoryTable uses which causes items to not be updated correctly.
      // Whenever the monitor is updated we'll generate a new key for the table
      // which will cause the table component to remount
      this.setState({ tableKey: uuid() });
    }
  }

  onDelete() {
    const { selectedItems } = this.state;
    const { updateMonitor, monitor } = this.props;
    const triggersToDelete = selectedItems.reduce(
      (map, item) => ({ ...map, [item.name]: true }),
      {}
    );
    const shouldKeepTrigger = trigger => !triggersToDelete[trigger.name];
    const updatedTriggers = monitor.triggers.filter(shouldKeepTrigger);
    updateMonitor({ triggers: updatedTriggers });
  }

  onEdit() {
    this.props.onEditTrigger(this.state.selectedItems[0]);
  }

  onSelectionChange(selectedItems) {
    this.setState({ selectedItems });
  }

  onTableChange({ sort: { field, direction } = {} }) {
    this.setState({ field, direction });
  }

  render() {
    const { direction, field, selectedItems, tableKey } = this.state;
    const { monitor, onCreateTrigger } = this.props;

    const columns = [
      {
        field: 'name',
        name: formatMessage({ id: 'alert.monitor.triggers.table.header.name' }),
        sortable: true,
        truncateText: true,
      },
      {
        field: 'actions',
        name: formatMessage({ id: 'alert.monitor.triggers.table.header.number_of_actions' }),
        sortable: true,
        truncateText: false,
        render: actions => actions.length,
      },
      {
        field: 'severity',
        name: formatMessage({ id: 'alert.monitor.triggers.table.header.severity' }),
        sortable: true,
        truncateText: false,
      },
      {
        actions: [{
          name: 'Edit',
          icon: 'documentEdit',
          type: 'icon',
          description: formatMessage({ id: 'form.button.edit' }),
          onClick: (item)=>{
            this.props.onEditTrigger(item);
          },
        }],
      },
    ];

    const sorting = { sort: { field, direction } };

    const selection = { onSelectionChange: this.onSelectionChange };

    return (
      <ContentPanel
        title={formatMessage({ id: 'alert.monitor.triggers.title' })}
        titleSize="s"
        bodyStyles={{ padding: 'initial' }}
        actions={[
          // <EuiButton onClick={this.onEdit} disabled={selectedItems.length !== 1}>
          //    {formatMessage({ id: 'form.button.edit' })}
          // </EuiButton>,
          <EuiButton onClick={this.onDelete} disabled={!selectedItems.length}>
            {formatMessage({ id: 'form.button.delete' })}
          </EuiButton>,
          <EuiButton
            onClick={onCreateTrigger}
            disabled={monitor.triggers.length >= MAX_TRIGGERS}
            fill
          >
            {formatMessage({ id: 'form.button.create' })}
          </EuiButton>,
        ]}
      >
        <EuiInMemoryTable
          items={monitor.triggers}
          itemId="id"
          key={tableKey}
          columns={columns}
          sorting={sorting}
          isSelectable={true}
          selection={selection}
          onTableChange={this.onTableChange}
        />
      </ContentPanel>
    );
  }
}

Triggers.propTypes = {
  monitor: PropTypes.object.isRequired,
  updateMonitor: PropTypes.func.isRequired,
  onEditTrigger: PropTypes.func.isRequired,
  onCreateTrigger: PropTypes.func.isRequired,
};
