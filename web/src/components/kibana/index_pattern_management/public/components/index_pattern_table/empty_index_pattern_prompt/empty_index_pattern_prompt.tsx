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
import './empty_index_pattern_prompt.scss';

import React from 'react';

import { EuiPageContent, EuiSpacer, EuiText, EuiFlexItem, EuiFlexGroup } from '@elastic/eui';
import { EuiDescriptionListTitle } from '@elastic/eui';
import { EuiDescriptionListDescription, EuiDescriptionList } from '@elastic/eui';
import { EuiLink } from '@elastic/eui';
import { getListBreadcrumbs } from '../../breadcrumbs';
import { IndexPatternCreationOption } from '../../types';
import { CreateButton } from '../../create_button';
import { Illustration } from './assets/index_pattern_illustration';
import { ManagementAppMountParams } from '../../../../../management/public';
import Link from 'umi/link';
import Exception from '@/components/Exception';

interface Props {
  canSave: boolean;
  creationOptions: IndexPatternCreationOption[];
  docLinksIndexPatternIntro: string;
  setBreadcrumbs: ManagementAppMountParams['setBreadcrumbs'];
}

export const EmptyIndexPatternPrompt = ({
  canSave,
  creationOptions,
  docLinksIndexPatternIntro,
  setBreadcrumbs,
}: Props) => {
  setBreadcrumbs(getListBreadcrumbs());

  return (
    <EuiPageContent
      data-test-subj="emptyIndexPatternPrompt"
      className="inpEmptyIndexPatternPrompt"
      grow={false}
      horizontalPosition="center"
    >
      <EuiFlexGroup gutterSize="xl" alignItems="center" direction="rowReverse" wrap>
        {/* <EuiFlexItem grow={1} className="inpEmptyIndexPatternPrompt__illustration">
          <Illustration />
        </EuiFlexItem> */}
        <EuiFlexItem grow={2} className="inpEmptyIndexPatternPrompt__text">
          <EuiText grow={false}>
            <h2>
              Elasticsearch 里面有数据。
              <br />
              去试试创建一个数据视图吧。
            </h2>
            <p>
              极限搜索中心通过创建数据视图来标识您想要浏览的索引，一个数据视图可以对应一个索引或多个索引。比如数据视图 server_log 匹配索引 
              server_log, server_log* 匹配所有以 server_log 开头的索引。
            </p>
            {canSave && (
               <CreateButton options={creationOptions}>
                创建数据视图
               </CreateButton>
            )}
          </EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="xxl" />
      <EuiDescriptionList className="inpEmptyIndexPatternPrompt__footer" type="responsiveColumn">
        <EuiDescriptionListTitle className="inpEmptyIndexPatternPrompt__title">
          了解更多?
        </EuiDescriptionListTitle>
        <EuiDescriptionListDescription>
          <EuiLink href={docLinksIndexPatternIntro} target="_blank" external>
            阅读文档
          </EuiLink>
        </EuiDescriptionListDescription>
      </EuiDescriptionList>
    </EuiPageContent>
  );
};
