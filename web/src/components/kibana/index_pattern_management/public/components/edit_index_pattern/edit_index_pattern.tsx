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

import { filter } from 'lodash';
import React, { useEffect, useState, useCallback } from 'react';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiBadge,
  EuiText,
  EuiLink,
  EuiCallOut,
  EuiPanel,
} from '@elastic/eui';
// import { IndexPattern, IndexPatternField } from '../../../../../plugins/data/public';
// import { useKibana } from '../../../../../plugins/kibana_react/public';
// import { IndexPatternManagmentContext } from '../../types';
import { Tabs } from './tabs';
import { IndexHeader } from './index_header';
import { IndexPatternTableItem } from '../types';
import { getIndexPatterns } from '../utils';
import {useGlobalContext} from '../../context';
import { IndexPattern, IndexPatternField } from '../../import';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';
import styles from '@/pages/System/Cluster/step.less';
import clusterBg from '@/assets/cluster_bg.png';


export interface EditIndexPatternProps extends RouteComponentProps {
  indexPattern: IndexPattern;
}

const mappingAPILink = 'Mapping API';

const mappingConflictHeader = 'Mapping 冲突';

const confirmMessage = 'This action resets the popularity counter of each field.';

const confirmModalOptionsRefresh = {
  confirmButtonText: 'Refresh',
  title: 'Refresh field list?',
};

const confirmModalOptionsDelete = {
  confirmButtonText: 'Delete',
  title: 'Delete index pattern?',
};

export const EditIndexPattern = withRouter(
  ({ indexPattern, history, location }: EditIndexPatternProps) => {
    const {
      uiSettings,
      indexPatternManagementStart,
      // overlays,
      savedObjects,
      // chrome,
      data,
    } = useGlobalContext(); //useKibana<IndexPatternManagmentContext>().services;
    const [fields, setFields] = useState<IndexPatternField[]>(indexPattern.getNonScriptedFields());
    const [conflictedFields, setConflictedFields] = useState<IndexPatternField[]>(
      indexPattern.fields.getAll().filter((field) => field.type === 'conflict')
    );
    const [defaultIndex, setDefaultIndex] = useState<string>(uiSettings.get('defaultIndex'));
    const [tags, setTags] = useState<any[]>([]);

    useEffect(() => {
      setFields(indexPattern.getNonScriptedFields());
      setConflictedFields(
        indexPattern.fields.getAll().filter((field) => field.type === 'conflict')
      );
    }, [indexPattern]);

    useEffect(() => {
      const indexPatternTags =
        indexPatternManagementStart.list.getIndexPatternTags(
          indexPattern,
          indexPattern.id === defaultIndex
        ) || [];
      setTags(indexPatternTags);
    }, [defaultIndex, indexPattern, indexPatternManagementStart.list]);

    const setDefaultPattern = useCallback(() => {
      uiSettings.set('defaultIndex', indexPattern.id);
      setDefaultIndex(indexPattern.id || '');
    }, [uiSettings, indexPattern.id]);

    const refreshFields = () => {
      // overlays.openConfirm(confirmMessage, confirmModalOptionsRefresh).then(async (isConfirmed) => {
      //   if (isConfirmed) {
        (async ()=>{
          await data.indexPatterns.refreshFields(indexPattern);
          await data.indexPatterns.updateSavedObject(indexPattern);
          setFields(indexPattern.getNonScriptedFields());
        })()
      //   }
      // });
    };

    const removePattern = () => {
      async function doRemove() {
        if (indexPattern.id === defaultIndex) {
          const indexPatterns: IndexPatternTableItem[] = await getIndexPatterns(
            savedObjects.client,
            uiSettings.get('defaultIndex'),
            indexPatternManagementStart
          );
          // uiSettings.remove('defaultIndex');
          const otherPatterns = filter(indexPatterns, (pattern) => {
            return pattern.id !== indexPattern.id;
          });

          if (otherPatterns.length) {
            uiSettings.set('defaultIndex', otherPatterns[0].id);
          }
        }
        if (indexPattern.id) {
          Promise.resolve(data.indexPatterns.delete(indexPattern.id)).then(function () {
            history.push('');
          });
        }
      }

      // overlays.openConfirm('', confirmModalOptionsDelete).then((isConfirmed) => {
      //   if (isConfirmed) {
          doRemove();
        // }
      // });
    };

    const timeFilterHeader = `时间字段: '${indexPattern.timeFieldName}'`;

    const mappingConflictLabel = 
          `当前视图匹配的索引有 ${conflictedFields.length} 字段定义了几种类型，如 (string, integer, 等)。您可以继续使用冲突的字段, 但是不能和函数一起使用(系统不知道冲突字段类型)。您可以重新生成索引来解决这个问题`;

    const headingAriaLabel = '视图详情';

    // chrome.docTitle.change(indexPattern.title);

    const showTagsSection = Boolean(indexPattern.timeFieldName || (tags && tags.length > 0));

    const content = (
      <div className={styles.pageHeaderContent}>
        <EuiText>
              <p>
                当前页面列出匹配 <strong>{indexPattern.title}</strong> 索引的所有字段，字段类型为 Elasticsearch 定义类型。 若需要更改类型，请使用 Elasticsearch{' '}
                <EuiLink
                  href="http://www.elastic.co/guide/en/elasticsearch/reference/current/mapping.html"
                  target="_blank"
                  external
                >
                  {mappingAPILink}
                </EuiLink>
              </p>
            </EuiText>
      </div>
    );
    
    const extraContent = (
      <div className={styles.extraImg}>
        <img
          alt="数据视图"
          src={clusterBg}
        />
      </div>
    );

    return (
      <PageHeaderWrapper title={indexPattern.viewName} content={content} extraContent={extraContent}>
        <EuiPanel paddingSize={'l'}>
          <div data-test-subj="editIndexPattern" role="region" aria-label={headingAriaLabel}>
            <IndexHeader
              indexPattern={indexPattern}
              setDefault={setDefaultPattern}
              refreshFields={refreshFields}
              deleteIndexPatternClick={removePattern}
              defaultIndex={defaultIndex}
            />
            {/* <EuiSpacer size="s" />
            {showTagsSection && (
              <EuiFlexGroup wrap>
                {Boolean(indexPattern.timeFieldName) && (
                  <EuiFlexItem grow={false}>
                    <EuiBadge color="warning">{timeFilterHeader}</EuiBadge>
                  </EuiFlexItem>
                )}
                {tags.map((tag: any) => (
                  <EuiFlexItem grow={false} key={tag.key}>
                    <EuiBadge color="hollow">{tag.name}</EuiBadge>
                  </EuiFlexItem>
                ))}
              </EuiFlexGroup>
            )} */}
            {/* <EuiSpacer size="m" />
            <EuiText>
              <p>
                当前页面列出匹配 <strong>{indexPattern.title}</strong> 索引的所有字段，字段类型为 Elasticsearch 定义类型。 若需要更改类型，请使用 Elasticsearch{' '}
                <EuiLink
                  href="http://www.elastic.co/guide/en/elasticsearch/reference/current/mapping.html"
                  target="_blank"
                  external
                >
                  {mappingAPILink}
                </EuiLink>
              </p>
            </EuiText> */}
            {conflictedFields.length > 0 && (
              <>
                <EuiSpacer />
                <EuiCallOut title={mappingConflictHeader} color="warning" iconType="alert">
                  <p>{mappingConflictLabel}</p>
                </EuiCallOut>
              </>
            )}
            {/* <EuiSpacer /> */}
            <Tabs
              indexPattern={indexPattern}
              saveIndexPattern={data.indexPatterns.updateSavedObject.bind(data.indexPatterns)}
              fields={fields}
              history={history}
              location={location}
            />
          </div>
        </EuiPanel>
      </PageHeaderWrapper>
    );
  }
);
