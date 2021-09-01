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

import {
  EuiBadge,
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiInMemoryTable,
  EuiSpacer,
  EuiText,
  EuiBadgeGroup,
  EuiPageContent,
  EuiTitle,
  EuiContext,
} from '@elastic/eui';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { reactRouterNavigate } from '../../../../kibana_react/public';
import { IndexPatternTableItem, IndexPatternCreationOption } from '../types';
import { getIndexPatterns } from '../utils';
import { EmptyState } from './empty_state';
import { MatchedItem, ResolveIndexResponseItemAlias } from '../create_index_pattern_wizard/types';
import { EmptyIndexPatternPrompt } from './empty_index_pattern_prompt';
import { getIndices } from '../create_index_pattern_wizard/lib';
import { useGlobalContext } from '../../context';
import {Button} from 'antd';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';
import styles from '@/pages/System/Cluster/step.less';
import clusterBg from '@/assets/cluster_bg.png';

const pagination = {
  initialPageSize: 10,
  pageSizeOptions: [5, 10, 25, 50],
};

const sorting = {
  sort: {
    field: 'title',
    direction: 'asc' as const,
  },
};

const search = {
  box: {
    incremental: true,
    schema: {
      fields: { title: { type: 'string' } },
    },
  },
};


const ariaRegion = '数据视图';

const title = '数据视图';

const content = (
  <div className={styles.pageHeaderContent}>
    <p>
    创建和管理数据视图可以帮助您更好地从 Elasticsearch 获取数据。
    </p>
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

interface Props extends RouteComponentProps {
  canSave: boolean;
}

export const IndexPatternTable = ({ canSave, history, selectedCluster }: Props) => {
  const {
    setBreadcrumbs,
    savedObjects,
    uiSettings,
    indexPatternManagementStart,
    docLinks,
    http,
    getMlCardState,
    data,
  } = useGlobalContext();//useKibana<IndexPatternManagmentContext>().services;
  const [indexPatterns, setIndexPatterns] = useState<IndexPatternTableItem[]>([]);
  const [creationOptions, setCreationOptions] = useState<IndexPatternCreationOption[]>([]);
  const [sources, setSources] = useState<MatchedItem[]>([]);
  const [remoteClustersExist, setRemoteClustersExist] = useState<boolean>(false);
  const [isLoadingSources, setIsLoadingSources] = useState<boolean>(true);
  const [isLoadingIndexPatterns, setIsLoadingIndexPatterns] = useState<boolean>(true);

  // setBreadcrumbs(getListBreadcrumbs());
  useEffect(() => {
    (async function () {
      const options = await indexPatternManagementStart.creation.getIndexPatternCreationOptions(
        history.push
      );
      const gettedIndexPatterns: IndexPatternTableItem[] = await getIndexPatterns(
        savedObjects.client,
        uiSettings.get('defaultIndex'),
        indexPatternManagementStart
      );
      setIsLoadingIndexPatterns(false);
      setCreationOptions(options);
      setIndexPatterns(gettedIndexPatterns);
    })();
  }, [
    history.push,
    indexPatterns.length,
    indexPatternManagementStart,
    uiSettings,
    savedObjects.client,
    selectedCluster,
  ]);

  const removeAliases = (item: MatchedItem) =>
    !((item as unknown) as ResolveIndexResponseItemAlias).indices;

  const searchClient = data.search.search;

  const loadSources = () => {
    getIndices({ http, pattern: '*', searchClient }).then((dataSources) =>
      setSources(dataSources.filter(removeAliases))
    );
    getIndices({ http, pattern: '*:*', searchClient }).then((dataSources) =>
      setRemoteClustersExist(!!dataSources.filter(removeAliases).length)
    );
  };

  useEffect(() => {
    getIndices({ http, pattern: '*', searchClient }).then((dataSources) => {
      setSources(dataSources.filter(removeAliases));
      setIsLoadingSources(false);
    });
    getIndices({ http, pattern: '*:*', searchClient }).then((dataSources) =>
      setRemoteClustersExist(!!dataSources.filter(removeAliases).length)
    );
  }, [http, creationOptions, searchClient,selectedCluster,]);

  // chrome.docTitle.change(title);

  const columns = [
    {
      field: 'viewName',
      name: '视图名称',
      render:(
        name: string,
        index: {
          id: string;
          tags?: Array<{
            key: string;
            name: string;
          }>;
        }
      )=><>
        <EuiButtonEmpty style={{fontSize:14}} size="xs" {...reactRouterNavigate(history, `patterns/${index.id}`)}>
        {name}
      </EuiButtonEmpty>
      </>
    },
    {
      field: 'title',
      name: '匹配规则',
      dataType: 'string' as const,
      sortable: ({ sort }: { sort: string }) => sort,
    },
  ];

  const createButton = canSave ? (
    <Button icon="plus" type="primary" onClick={()=>{
      creationOptions[0].onClick();
    }}>
      创建{title}
    </Button>
  ) : (
    <></>
  );

  if (isLoadingSources || isLoadingIndexPatterns) {
    return <></>;
  }

  const hasDataIndices = sources.some(({ name }: MatchedItem) => !name.startsWith('.'));

  if (!indexPatterns.length) {
    if (!hasDataIndices && !remoteClustersExist) {
      return (
        <EmptyState/>
      );
    } else {
      return (
        <EmptyIndexPatternPrompt
          creationOptions={creationOptions}
        />
      );
    }
  }

  const renderToolsRight = () => {
    return [
      createButton
    ];
  };

  return (
    <PageHeaderWrapper title="数据视图" content={content} extraContent={extraContent}>
    <EuiPageContent data-test-subj="indexPatternTable" role="region" aria-label={ariaRegion}>
      <EuiContext i18n={{
        mapping: {
          'euiTablePagination.rowsPerPage': '每页行数',
          'euiTablePagination.rowsPerPageOption': '{rowsPerPage} 行'
        }
      }}>
      <EuiInMemoryTable
        allowNeutralSort={false}
        itemId="id"
        isSelectable={false}
        items={indexPatterns}
        columns={columns}
        pagination={pagination}
        sorting={sorting}
        search={{
          ...search, 
          toolsRight: renderToolsRight(),
        }}
      />
      </EuiContext>
    </EuiPageContent>
    </PageHeaderWrapper>
  );
};

export const IndexPatternTableWithRouter = withRouter(IndexPatternTable);
