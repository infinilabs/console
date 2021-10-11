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

import React from 'react';
import { EuiFlexGroup, EuiToolTip, EuiFlexItem, EuiTitle, EuiButtonIcon } from '@elastic/eui';
import { IIndexPattern } from 'src/plugins/data/public';
import {Popconfirm} from 'antd';

interface IndexHeaderProps {
  indexPattern: IIndexPattern;
  defaultIndex?: string;
  setDefault?: () => void;
  refreshFields?: () => void;
  deleteIndexPatternClick?: () => void;
}

const setDefaultAriaLabel = '设置为默认视图';

const setDefaultTooltip = '设置为默认视图';

const refreshAriaLabel = '重新加载字段列表';

const refreshTooltip = '刷新字段列表';

const removeAriaLabel = '删除视图';

const removeTooltip = '删除视图';

export function IndexHeader({
  defaultIndex,
  indexPattern,
  setDefault,
  refreshFields,
  deleteIndexPatternClick,
}: IndexHeaderProps) {
  return (
    <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
      {/* <EuiFlexItem>
        <EuiTitle>
          <h1 data-test-subj="indexPatternTitle">{indexPattern.viewName}</h1>
        </EuiTitle>
      </EuiFlexItem> */}
      <EuiFlexItem grow={false} style={{marginLeft:'auto'}}>
        <EuiFlexGroup responsive={false}>
          {defaultIndex !== indexPattern.id && setDefault && (
            <EuiFlexItem>
              <EuiToolTip content={setDefaultTooltip}>
                <EuiButtonIcon
                  color="text"
                  onClick={setDefault}
                  iconType="starFilled"
                  aria-label={setDefaultAriaLabel}
                  data-test-subj="setDefaultIndexPatternButton"
                />
              </EuiToolTip>
            </EuiFlexItem>
          )}

          {/* {refreshFields && (
            <EuiFlexItem>
              <EuiToolTip content={refreshTooltip}>
                <EuiButtonIcon
                  color="text"
                  onClick={refreshFields}
                  iconType="refresh"
                  aria-label={refreshAriaLabel}
                  data-test-subj="refreshFieldsIndexPatternButton"
                />
              </EuiToolTip>
            </EuiFlexItem>
          )} */}

          {deleteIndexPatternClick && (
            <EuiFlexItem>
              <EuiToolTip content={removeTooltip}>
                <Popconfirm title="确定要删除？" onConfirm={deleteIndexPatternClick}>
                  <EuiButtonIcon
                    color="danger"
                    // onClick={deleteIndexPatternClick}
                    iconType="trash"
                    aria-label={removeAriaLabel}
                    data-test-subj="deleteIndexPatternButton"
                  />
                </Popconfirm>
              </EuiToolTip>
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
}
