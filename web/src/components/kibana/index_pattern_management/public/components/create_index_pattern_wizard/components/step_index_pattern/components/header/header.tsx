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

import {
  EuiTitle,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiButton,
  EuiForm,
  EuiFormRow,
  EuiFieldText,
  EuiSwitchEvent,
  EuiSwitch,
} from '@elastic/eui';
import {useState} from 'react';
import {Button, Icon} from 'antd';


interface HeaderProps {
  isInputInvalid: boolean;
  errors: any;
  characterList: string;
  query: string;
  onQueryChanged: (e: React.ChangeEvent<HTMLInputElement>) => void;
  viewName: string;
  goToNextStep: (query: string, viewName: string) => void;
  isNextStepDisabled: boolean;
  showSystemIndices?: boolean;
  onChangeIncludingSystemIndices: (event: EuiSwitchEvent) => void;
  isIncludingSystemIndices: boolean;
  onViewNameChange: (viewName: string)=>void;
}

export const Header: React.FC<HeaderProps> = ({
  isInputInvalid,
  errors,
  characterList,
  query,
  onQueryChanged,
  goToNextStep,
  isNextStepDisabled,
  showSystemIndices = false,
  onChangeIncludingSystemIndices,
  isIncludingSystemIndices,
  onViewNameChange,
  viewName,
  ...rest
}) => {
  return (<div {...rest}>
    <EuiTitle size="s">
      <h2>
        步骤 1 / 2: 定义数据视图
      </h2>
    </EuiTitle>
    <EuiSpacer size="m" />
    <EuiFlexGroup>
      <EuiFlexItem>
        <EuiForm>
        <EuiFormRow
            isInvalid={viewName.replace(' ', '').length <= 0}
            error='必填'
            fullWidth
            label={
              "数据视图名称"
            }
            helpText={
              <>
                名称不能为空
              </>
            }
          >
            <EuiFieldText
              name="name"
              placeholder={ 'view name'}
              value={viewName}
              isInvalid={viewName.replace(' ', '').length <= 0}
              fullWidth
              onChange={(e: React.ChangeEvent<HTMLInputElement>)=>{
                onViewNameChange(e.target.value);
              }}
            />
          </EuiFormRow>
          <EuiFormRow
            fullWidth
            label={
              "匹配规则"
            }
            isInvalid={isInputInvalid}
            error={errors}
            helpText={
              <>
                使用 (<strong>*</strong>) 来匹配多个索引。{' '}
                不能包含空格或者字符 <strong>{characterList}</strong>.
              </>
            }
          >
            <EuiFieldText
              name="indexPattern"
              placeholder={ 'index-name-*'}
              value={query}
              isInvalid={isInputInvalid}
              onChange={onQueryChanged}
              data-test-subj="createIndexPatternNameInput"
              fullWidth
            />
          </EuiFormRow>

          {showSystemIndices ? (
            <EuiFormRow>
              <EuiSwitch
                label={
                  "包含系统或者隐藏索引"
                }
                id="checkboxShowSystemIndices"
                checked={isIncludingSystemIndices}
                onChange={onChangeIncludingSystemIndices}
                data-test-subj="showSystemAndHiddenIndices"
              />
            </EuiFormRow>
          ) : null}
        </EuiForm>
      </EuiFlexItem>
      <EuiFlexItem grow={false} >
        <EuiFormRow hasEmptyLabelSpace style={{marginBottom:60,marginTop:'auto'}}>
          <Button
            type="primary"
            onClick={() => {
              goToNextStep(query, viewName)
            }}
            disabled={isNextStepDisabled || viewName.replace(' ', '').length <= 0}
          >
            下一步<Icon type="right"/>
          </Button>
        </EuiFormRow>
      </EuiFlexItem>
    </EuiFlexGroup>
  </div>
)};
