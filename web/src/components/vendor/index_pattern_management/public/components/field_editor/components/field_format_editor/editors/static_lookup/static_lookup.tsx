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

import React, { Fragment } from 'react';

import { EuiBasicTable, EuiButton, EuiFieldText, EuiFormRow, EuiSpacer } from '@elastic/eui';

import { DefaultFormatEditor } from '../default';

export interface StaticLookupFormatEditorFormatParams {
  lookupEntries: Array<{ key: string; value: string }>;
  unknownKeyValue: string;
}

interface StaticLookupItem {
  key: string;
  value: string;
  index: number;
}

export class StaticLookupFormatEditor extends DefaultFormatEditor<
  StaticLookupFormatEditorFormatParams
> {
  static formatId = 'static_lookup';
  onLookupChange = (newLookupParams: { value?: string; key?: string }, index: number) => {
    const lookupEntries = [...this.props.formatParams.lookupEntries];
    lookupEntries[index] = {
      ...lookupEntries[index],
      ...newLookupParams,
    };
    this.onChange({
      lookupEntries,
    });
  };

  addLookup = () => {
    const lookupEntries = [...this.props.formatParams.lookupEntries];
    this.onChange({
      lookupEntries: [...lookupEntries, {}],
    });
  };

  removeLookup = (index: number) => {
    const lookupEntries = [...this.props.formatParams.lookupEntries];
    lookupEntries.splice(index, 1);
    this.onChange({
      lookupEntries,
    });
  };

  render() {
    const { formatParams } = this.props;

    const items =
      (formatParams.lookupEntries &&
        formatParams.lookupEntries.length &&
        formatParams.lookupEntries.map((lookup, index) => {
          return {
            ...lookup,
            index,
          };
        })) ||
      [];

    const columns = [
      {
        field: 'key',
        name: (
          "Key"
        ),
        render: (value: number, item: StaticLookupItem) => {
          return (
            <EuiFieldText
              value={value || ''}
              onChange={(e) => {
                this.onLookupChange(
                  {
                    key: e.target.value,
                  },
                  item.index
                );
              }}
            />
          );
        },
      },
      {
        field: 'value',
        name: (
          "Value"
        ),
        render: (value: number, item: StaticLookupItem) => {
          return (
            <EuiFieldText
              value={value || ''}
              onChange={(e) => {
                this.onLookupChange(
                  {
                    value: e.target.value,
                  },
                  item.index
                );
              }}
            />
          );
        },
      },
      {
        field: 'actions',
        name: 'actions',
        actions: [
          {
            name: 'Delete',
            description: 'Delete entry',
            onClick: (item: StaticLookupItem) => {
              this.removeLookup(item.index);
            },
            type: 'icon',
            icon: 'trash',
            color: 'danger',
            available: () => items.length > 1,
          },
        ],
        width: '30px',
      },
    ];

    return (
      <Fragment>
        <EuiBasicTable items={items} columns={columns} style={{ maxWidth: '400px' }} />
        <EuiSpacer size="m" />
        <EuiButton iconType="plusInCircle" size="s" onClick={this.addLookup}>
          Add entry
        </EuiButton>
        <EuiSpacer size="l" />
        <EuiFormRow
          label={
            "Value for unknown key"
          }
        >
          <EuiFieldText
            value={formatParams.unknownKeyValue || ''}
            placeholder={'Leave blank to keep value as-is'}
            onChange={(e) => {
              this.onChange({ unknownKeyValue: e.target.value });
            }}
          />
        </EuiFormRow>
        <EuiSpacer size="m" />
      </Fragment>
    );
  }
}
