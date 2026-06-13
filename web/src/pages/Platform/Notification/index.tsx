import React from "react";
import PageHeaderWrapper from "@/components/PageHeaderWrapper";
import {
  Tabs,
  Card,
  Table,
  Tag,
  Popconfirm,
  Divider,
  Form,
  Row,
  Col,
  Button,
  Select,
  Input,
  message,
  Switch,
} from "antd";
import { formatMessage } from "umi/locale";
import useFetch from "@/lib/hooks/use_fetch";
import { ESPrefix } from "@/services/common";
import { useGlobal } from "@/layouts/GlobalContext";
import router from "umi/router";
import Link from "umi/link";
import { connect } from "dva";
import { useCallback, useEffect, useMemo, useState } from "react";
import request from "@/utils/request";
import moment from "moment";
import { formatter } from "@/lib/format";
import { formatESSearchResult } from "@/lib/elasticsearch/util";
import { filterSearchValue, sorter, formatUtcTimeToLocal } from "@/utils/utils";
import { HealthStatusView } from "@/components/infini/health_status_view";
import { Route } from "umi";
import { JsonParam, QueryParamProvider, useQueryParam } from "use-query-params";
import { hasAuthority } from "@/utils/authority";
import "./index.scss";
import _ from "lodash";
import Markdown from "@/components/Markdown";
import SearchInput from "@/components/infini/SearchInput";

const { TabPane } = Tabs;
const { Option } = Select;

const normalizeTimeValue = (value, fallback = "auto", keys = []) => {
  if (typeof value === "string" || typeof value === "number") {
    return `${value}`;
  }
  if (value && typeof value === "object") {
    for (const key of keys) {
      if (
        Object.prototype.hasOwnProperty.call(value, key) &&
        value[key] !== undefined &&
        value[key] !== null
      ) {
        const candidate = value[key];
        if (typeof candidate === "string" || typeof candidate === "number") {
          return `${candidate}`;
        }
      }
    }
  }
  return fallback;
};

const tryParseJSON = (value) => {
  if (!value || typeof value !== "string") return undefined;
  try {
    return JSON.parse(value);
  } catch (e) {
    return undefined;
  }
};

const normalizeAlertingMessageLink = (rawLink = "") => {
  let link = rawLink || "";
  if (link.indexOf("/#") === 0) {
    link = link.substr(2);
  }
  if (!link || !link.includes("/alerting/message")) {
    return link;
  }
  const [pathname, queryString = ""] = link.split("?");
  if (!queryString) {
    return pathname;
  }
  const params = new URLSearchParams(queryString);
  const rawG = params.get("_g");
  if (!rawG) {
    return link;
  }
  const parsedG = tryParseJSON(rawG) || tryParseJSON(decodeURIComponent(rawG));
  if (!parsedG || typeof parsedG !== "object") {
    return pathname;
  }
  const normalizedG = { ...parsedG };
  const range = normalizedG?.timeRange;
  if (typeof normalizedG.start_time !== "string") {
    normalizedG.start_time = normalizeTimeValue(
      normalizedG.start_time ?? range?.min ?? range?.from,
      "auto",
      ["from", "min", "gte", "start"]
    );
  }
  if (typeof normalizedG.end_time !== "string") {
    normalizedG.end_time = normalizeTimeValue(
      normalizedG.end_time ?? range?.max ?? range?.to,
      "auto",
      ["to", "max", "lte", "end"]
    );
  }
  params.set("_g", JSON.stringify(normalizedG));
  return `${pathname}?${params.toString()}`;
};

const Index = (props) => {
  const [param, setParam] = useQueryParam("_g", JsonParam);
  const [searchValue, setSearchValue] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [dataSource, setDataSource] = useState({ data: [], total: 0 });

  const initialQueryParams = {
    from: 0,
    size: 20,
    ...param,
  };

  const alertReducer = (queryParams, action) => {
    switch (action.type) {
      case "search":
        return {
          ...queryParams,
          keyword: action.value,
        };
      case "type":
        return {
          ...queryParams,
          type: action.value,
        };
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
  const [queryParams, dispatch] = React.useReducer(
    alertReducer,
    initialQueryParams
  );

  const onRefreshClick = () => {
    dispatch({ type: "refresh" });
  };

  const onClearClick = useCallback(async (ids) => {
    const res = await request(`/alerting/channel`, {
      method: "DELETE",
      body: { ids: ids },
    });
    if (res && res.result == "deleted") {
      message.success("delete succeed");
      setTimeout(() => {
        onRefreshClick();
      }, 1000);
    } else {
      console.log("delete failed,", res);
      message.error("delete failed");
    }
  }, []);

  const columns = [
    {
      title: formatMessage({ id: "platform.notification.table.title" }),
      dataIndex: "title",
      render: (text, record) => <span>{record.title}</span>,
    },
    {
      title: formatMessage({ id: "platform.notification.table.created" }),
      dataIndex: "created",
      render: (text, record) => (
        <span title={text}>{moment(record.created).fromNow()}</span>
      ),
    },
    {
      title: formatMessage({ id: "platform.notification.table.status" }),
      dataIndex: "status",
      render: (text, record) => (
        <Tag
          color={text == "new" ? "#108ee9" : undefined}
          className={text == "new" ? "" : "notice-status-read"}
        >
          {text == "new"
            ? formatMessage({ id: "platform.notification.status.new" })
            : formatMessage({ id: "platform.notification.status.read" })}
        </Tag>
      ),
    },
    {
      title: formatMessage({ id: "table.field.actions" }),
      render: (text, record) => {
        const link = normalizeAlertingMessageLink(record.link || "");
        return (
          <div>
            <Link key="link" to={`${link}`} disabled={link ? false : true}>
              {formatMessage({ id: "form.button.view" })}
            </Link>
          </div>
        );
      },
    },
  ];

  const fetchList = (queryParams) => {
    setLoading(true);

    const fetchData = async () => {
      const res = await request("/notification/_search", {
        method: "POST",
        body: {
          ...queryParams,
        },
      });
      if (res && !res.error) {
        let { data, total } = formatESSearchResult(res);
        setDataSource({ data, total });
      }
      setLoading(false);
    };
    fetchData();
  };

  useEffect(() => {
    setParam({ ...param, ...queryParams });
    fetchList(queryParams);
  }, [queryParams]);

  useEffect(() => {
    setExpandedRowKeys(param.id ? [param.id] : []);
  }, [param.id]);

  const useG = useGlobal();

  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const onExpand = (expanded, record) => {
    if (expanded) {
      setExpandedRowKeys([record.id]);
    } else {
      setExpandedRowKeys([]);
    }
    //update status="read"
    useG.dispatch({
      type: "global/clearNotices",
      payload: { ids: [record.id], type: record.type },
    });
  };

  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const onSelectChange = (selectedRowKeys) => {
    setSelectedRowKeys(selectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

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
        <div style={{ width: 500 }}>
          <SearchInput
            allowClear
            placeholder="Type keyword to search"
            enterButton="Search"
            defaultValue={queryParams?.keyword}
            onSearch={(value) => {
              dispatch({ type: "search", value: value });
            }}
            onChange={(e) => {
              dispatch({ type: "search", value: e.currentTarget.value });
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
          {/* <>
            <Popconfirm
              title="Sure to clear?"
              onConfirm={() => {
                if (selectedRowKeys.length == 0) {
                  message.info(
                    formatMessage({
                      id: "app.message.warning.table.select-row",
                    })
                  );
                  return;
                }
                // onClearClick(selectedRowKeys);
              }}
            >
              <Button icon="delete" type="danger">
                {formatMessage({ id: "form.button.clear" })}
              </Button>
            </Popconfirm>
          </> */}
        </div>
      </div>
      <Table
        className="notice-table"
        size={"small"}
        loading={loading}
        bordered
        rowClassName={(record, index) => {
          if (record.status == "read") {
            return record.status;
          }
          return "";
        }}
        dataSource={dataSource?.data}
        rowKey={"id"}
        pagination={{
          size: "small",
          pageSize: queryParams.size,
          total: dataSource?.total?.value || 0,
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
        rowSelection={rowSelection}
        expandedRowRender={(record) => (
          <p style={{ margin: -8, maxHeight: 300, overflow: "auto" }}>
            <Markdown source={record.body} />
          </p>
        )}
        defaultExpandedRowKeys={param.id ? [param.id] : []}
        expandedRowKeys={expandedRowKeys}
        expandRowByClick={true}
        onExpand={onExpand}
      />
      </Card>
    </PageHeaderWrapper>
  );
};

export default (props) => {
  return (
    <QueryParamProvider ReactRouterRoute={Route}>
      <Index {...props} />
    </QueryParamProvider>
  );
};
