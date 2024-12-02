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
} from "@elastic/eui";
import { withRouter, RouteComponentProps } from "react-router-dom";
import React, { useState, useEffect, useReducer } from "react";
import { reactRouterNavigate } from "../../../../react/public";
import { IndexPatternTableItem, IndexPatternCreationOption } from "../types";
import { getIndexPatterns } from "../utils";
import { EmptyState } from "./empty_state";
import {
  MatchedItem,
  ResolveIndexResponseItemAlias,
} from "../create_index_pattern_wizard/types";
import { EmptyIndexPatternPrompt } from "./empty_index_pattern_prompt";
import { getIndices } from "../create_index_pattern_wizard/lib";
import { useGlobalContext } from "../../context";
import { Card, Button, Table, Input, Divider, Popconfirm, message } from "antd";
import PageHeaderWrapper from "@/components/PageHeaderWrapper";
import styles from "@/pages/System/Cluster/step.less";
import { router } from "umi";
import { formatMessage } from "umi/locale";
import { filterSearchValue, sorter } from "@/utils/utils";

const { Search } = Input;

const title = formatMessage({ id: "explore.viewlist.title" });

interface Props extends RouteComponentProps {
  canSave: boolean;
}

export const IndexPatternTable = ({
  canSave,
  history,
  selectedCluster,
}: Props) => {
  const {
    setBreadcrumbs,
    savedObjects,
    uiSettings,
    indexPatternManagementStart,
    docLinks,
    http,
    getMlCardState,
    data,
  } = useGlobalContext(); //useKibana<IndexPatternManagmentContext>().services;
  const [indexPatterns, setIndexPatterns] = useState<IndexPatternTableItem[]>(
    []
  );
  const [creationOptions, setCreationOptions] = useState<
    IndexPatternCreationOption[]
  >([]);
  const [sources, setSources] = useState<MatchedItem[]>([]);
  const [remoteClustersExist, setRemoteClustersExist] = useState<boolean>(
    false
  );
  const [isLoadingSources, setIsLoadingSources] = useState<boolean>(true);
  const [isLoadingIndexPatterns, setIsLoadingIndexPatterns] = useState<boolean>(
    true
  );

  const [searchValue, setSearchValue] = React.useState("");
  const initialQueryParams = {
    from: 0,
    size: 20,
    _t: new Date().getTime(),
  };
  const searchReducer = (queryParams, action) => {
    switch (action.type) {
      case "pagination":
        return {
          ...queryParams,
          from: (action.value - 1) * queryParams.size,
        };
      case "pageSizeChange":
        return {
          ...queryParams,
          size: action.value,
        };
      case "refresh":
        return {
          ...queryParams,
          _t: new Date().getTime(),
        };
    }
    return queryParams;
  };

  const [queryParams, dispatch] = useReducer(searchReducer, initialQueryParams);

  const onRefreshClick = () => {
    dispatch({ type: "refresh" });
  };
  const [hits, hitsTotal] = React.useMemo(() => {
    let hits = indexPatterns;
    if (searchValue) {
      hits = filterSearchValue(searchValue, indexPatterns, [
        "title",
        "viewName",
      ]);
    }
    return [hits, hits.length];
  }, [indexPatterns, searchValue]);

  // setBreadcrumbs(getListBreadcrumbs());
  useEffect(() => {
    (async function() {
      const options = await indexPatternManagementStart.creation.getIndexPatternCreationOptions(
        history.push
      );
      const gettedIndexPatterns: IndexPatternTableItem[] = await getIndexPatterns(
        savedObjects.client,
        uiSettings.get("defaultIndex"),
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
    queryParams._t,
  ]);

  const removeAliases = (item: MatchedItem) =>
    !((item as unknown) as ResolveIndexResponseItemAlias).indices;

  const searchClient = data.search.search;

  useEffect(() => {
    getIndices({ http, pattern: "*", searchClient }).then((dataSources) => {
      setSources(dataSources.filter(removeAliases));
      setIsLoadingSources(false);
    });
    getIndices({ http, pattern: "*:*", searchClient }).then((dataSources) =>
      setRemoteClustersExist(!!dataSources.filter(removeAliases).length)
    );
  }, [http, creationOptions, searchClient, selectedCluster]);

  const removePattern = async (id) => {
    console.log("id:", id);
    if (!id) {
      return;
    }
    Promise.resolve(data.indexPatterns.delete(id)).then(function(value) {
      if (
        value ||
        (typeof value == "object" && Object.keys(value).length == 0)
      ) {
        message.success("delete succeed");
        onRefreshClick();
      } else {
        message.error("delete failed");
      }
    });
  };

  // chrome.docTitle.change(title);

  const columns = [
    {
      title: formatMessage({ id: "explore.createview.field.name" }),
      dataIndex: "viewName",
      render: (text, record) => (
        <a
          onClick={() => {
            router.push(`/insight/discover?viewID=${record.id}`);
          }}
        >
          {text}
        </a>
      ),
      sorter: (a: string, b: string) => sorter.string(a, b, "viewName"),
    },
    {
      title: formatMessage({ id: "explore.createview.field.match_rule" }),
      dataIndex: "title",
      sorter: (a: string, b: string) => sorter.string(a, b, "title"),
    },
    {
      title: formatMessage({ id: "table.field.actions" }),
      render: (text, record) => (
        <div>
          {canSave ? (
            <>
              <a {...reactRouterNavigate(history, `patterns/${record.id}`)}>
                {formatMessage({ id: "form.button.edit" })}
              </a>
              <Divider type="vertical" />
              <Popconfirm
                title={formatMessage({ id: "app.message.confirm.delete" })}
                onConfirm={() => removePattern(record.id)}
              >
                <a>{formatMessage({ id: "form.button.delete" })}</a>
              </Popconfirm>
            </>
          ) : null}
        </div>
      ),
    },
  ];

  if (!canSave) {
    columns.splice(columns.length - 1)
  }

  const createButton = canSave ? (
    <Button
      icon="plus"
      type="primary"
      onClick={() => {
        creationOptions[0].onClick();
      }}
    >
      {formatMessage({ id: "explore.view.btn.create" })}
    </Button>
  ) : (
    <></>
  );

  if (isLoadingSources || isLoadingIndexPatterns) {
    return <></>;
  }

  const hasDataIndices = sources.some(
    ({ name }: MatchedItem) => !name.startsWith(".")
  );

  // if (!indexPatterns.length) {
  //   if (!hasDataIndices && !remoteClustersExist) {
  //     return <EmptyState />;
  //   } else {
  //     return (
  //       <EmptyIndexPatternPrompt
  //         canSave={canSave}
  //         creationOptions={creationOptions}
  //       />
  //     );
  //   }
  // }

  return (
    <PageHeaderWrapper>
      <Card>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 15,
          }}
        >
          <div style={{ maxWidth: 500, flex: "1 1 auto" }}>
            <Search
              allowClear
              placeholder="Type keyword to search"
              enterButton="Search"
              onSearch={(value) => {
                setSearchValue(value);
              }}
              onChange={(e) => {
                setSearchValue(e.currentTarget.value);
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Button
              icon="redo"
              onClick={() => {
                onRefreshClick();
              }}
            >
              {formatMessage({ id: "form.button.refresh" })}
            </Button>
            {createButton}
          </div>
        </div>
        <Table
          size={"small"}
          loading={isLoadingIndexPatterns}
          bordered
          dataSource={hits}
          rowKey={"id"}
          pagination={{
            size: "small",
            pageSize: queryParams.size,
            total: hitsTotal,
            onChange: (page) => {
              dispatch({ type: "pagination", value: page });
            },
            showSizeChanger: true,
            onShowSizeChange: (_, size) => {
              dispatch({ type: "pageSizeChange", value: size });
            },
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} items`,
          }}
          columns={columns}
        />
      </Card>
    </PageHeaderWrapper>
  );
};

export const IndexPatternTableWithRouter = withRouter(IndexPatternTable);
