import PageHeaderWrapper from "@/components/PageHeaderWrapper";
import {
  Card,
  Table,
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
  Icon,
  Dropdown,
  Menu,
} from "antd";
import { formatMessage } from "umi/locale";
import useFetch from "@/lib/hooks/use_fetch";
import { ESPrefix } from "@/services/common";
import { useGlobal } from "@/layouts/GlobalContext";
import router from "umi/router";
import Link from "umi/link";
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
import Slack from "@/components/Icons/Slack";
import Dingding from "@/components/Icons/Dingding";
import Wechat from "@/components/Icons/Wechat";
import Feishu from "@/components/Icons/Feishu";
import Webhook from "@/components/Icons/Webhook";
import Email from "@/components/Icons/Email";
import FormWebhook from "./FormWebhook";
import FormEmail from "./FormEmail";
import Import from "../components/Import";
import Export from "../components/Export";
import DiscordWithColor from "@/components/Icons/DiscordWithColor";

const { Search } = Input;
const { Option } = Select;

export const CHANNELS = [
  { key: "email", name: "Email", icon: Email, component: FormEmail },
  { key: "slack", name: "Slack", icon: Slack, component: FormWebhook },
  { key: "dingtalk", name: "DingTalk", icon: Dingding, component: FormWebhook },
  { key: "wechat", name: "Wechat", icon: Wechat, component: FormWebhook },
  { key: "feishu", name: "Feishu", icon: Feishu, component: FormWebhook },
  {
    key: "discord",
    name: "Discord",
    icon: DiscordWithColor,
    component: FormWebhook,
  },
  { key: "webhook", name: "Webhook", icon: Webhook, component: FormWebhook },
];

const Index = (props) => {
  const [param, setParam] = useQueryParam("_g", JsonParam);
  const [searchValue, setSearchValue] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [importVisible, setImportVisible] = useState(false);
  const [exportVisible, setExportVisible] = useState(false);
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
          sub_type: action.value,
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

  const onRefreshClick = useCallback(() => {
    dispatch({ type: "refresh" });
  }, []);

  const refresh = () => {
    setTimeout(() => {
      onRefreshClick();
    }, 1000);
  };

  const onDeleteClick = useCallback(async (ids) => {
    setLoading(true);
    const res = await request(`/alerting/channel`, {
      method: "DELETE",
      body: { ids: ids },
    });
    if (res && res.result == "deleted") {
      message.success(
        formatMessage({
          id: "app.message.delete.success",
        })
      );
      refresh();
      clearSelectedRows();
    } else {
      console.log("Delete failed,", res);
      message.error(
        formatMessage({
          id: "app.message.delete.failed",
        })
      );
    }
    setLoading(false);
  }, []);

  const onEnableClick = useCallback(async (ids, actionKey) => {
    let actionUrl = "";
    if (actionKey == "enable") {
      actionUrl = "/alerting/channel/_enable";
    } else if (actionKey == "disable") {
      actionUrl = "/alerting/channel/_disable";
    }
    if (!actionUrl || !(ids instanceof Array)) {
      message.warn(
        formatMessage({
          id: "app.message.warning.invalid.params",
        })
      );
      return;
    }
    const res = await request(actionUrl, {
      method: "POST",
      body: ids,
    });
    if (res && res?.acknowledged) {
      message.success(
        formatMessage({
          id: "app.message.operate.success",
        })
      );
      refresh();
    } else {
      console.log("operate failed,", res);
      message.error(
        formatMessage({
          id: "app.message.operate.failed",
        })
      );
    }
  }, []);

  const defaultSelectedRows = {
    rowKeys: [],
    rows: [],
  };
  const [selectedRows, setSelectedRows] = useState(defaultSelectedRows);
  const onSelectChange = (selectedRowKeys, selectedRows) => {
    let rows = selectedRows.map((item) => {
      return {
        id: item.id,
      };
    });
    setSelectedRows({ rowKeys: selectedRowKeys, rows: rows });
  };
  const clearSelectedRows = () => {
    setSelectedRows(defaultSelectedRows);
  };
  const rowSelection = {
    selectedRowKeys: selectedRows.rowKeys,
    onChange: onSelectChange,
  };

  const columns = [
    {
      title: formatMessage({ id: "alert.channel.table.columns.name" }),
      dataIndex: "name",
      render: (value, record) => {
        const { type, sub_type } = record;
        const channel = CHANNELS.find(
          (item) => item.key === (sub_type || type)
        );
        return (
          <>
            {channel?.icon && (
              <Icon
                style={{ verticalAlign: "-3px", fontSize: 16, marginRight: 8 }}
                component={channel.icon}
              />
            )}
            <span>{value}</span>
          </>
        );
      },
    },
    {
      title: formatMessage({ id: "alert.channel.table.columns.enable" }),
      dataIndex: "enabled",
      render: (value, record) => (
        <Switch
          disabled={hasAuthority("alerting.rule:all") ? false : true}
          checked={value}
          size={"small"}
          onChange={(checked) => {
            onEnableClick([record.id], checked ? "enable" : "disable");
          }}
        />
      ),
    },
    {
      title: formatMessage({ id: "alert.message.detail.updated" }),
      dataIndex: "updated",
      render: (text, record) => (
        <span title={text}>{formatUtcTimeToLocal(text)}</span>
      ),
    },
    {
      title: formatMessage({ id: "table.field.actions" }),
      render: (text, record) => (
        <div>
          {hasAuthority("alerting.channel:all") ? (
            <>
              <Link key="edit" to={`/alerting/channel/edit/${record.id}`}>
                {formatMessage({ id: "form.button.edit" })}
              </Link>
              <Divider key="d3" type="vertical" />
              <Popconfirm
                title="Sure to delete?"
                onConfirm={() => onDeleteClick([record.id])}
              >
                <a>{formatMessage({ id: "form.button.delete" })}</a>
              </Popconfirm>
            </>
          ) : null}
        </div>
      ),
      width: 110,
    },
  ];

  if (!hasAuthority("alerting.channel:all")) {
    columns.splice(columns.length - 1)
  }

  const handleBatchMenuClick = ({ key }) => {
    if (selectedRows.rowKeys.length == 0) {
      message.warn(
        formatMessage({
          id: "app.message.warning.table.select-row",
        })
      );
      return;
    }
    switch (key) {
      case "enable":
        onEnableClick(selectedRows.rowKeys, "enable");
        break;
      case "disable":
        onEnableClick(selectedRows.rowKeys, "disable");
        break;
      case "export":
        setExportVisible(true);
        break;
      case "delete":
        onDeleteClick(selectedRows.rowKeys);
        break;
    }
  };

  const batchMenu = (
    <Menu onClick={handleBatchMenuClick}>
      <Menu.Item key="enable">
        <Icon type="check-circle" />
        {formatMessage({ id: "form.button.enable" })}
      </Menu.Item>
      <Menu.Item key="disable">
        <Icon type="stop" />
        {formatMessage({ id: "form.button.disable" })}
      </Menu.Item>
      <Menu.Item key="export">
        <Icon type="download" />
        {formatMessage({ id: "form.button.export" })}
      </Menu.Item>
      <Menu.Item key="delete">
        <Icon type="delete" />
        {formatMessage({ id: "form.button.delete" })}
      </Menu.Item>
    </Menu>
  );

  const fetchList = (queryParams) => {
    setLoading(true);

    const fetchData = async () => {
      let url = `/alerting/channel/_search`;
      const res = await request(url, {
        method: "GET",
        queryParams: {
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
          <div
            style={{
              display: "flex",
              gap: 10,
              width: 600,
            }}
          >
            <Select
              allowClear
              showSearch
              style={{ width: 150 }}
              placeholder={"webhook"}
              defaultValue={queryParams?.sub_type}
              onChange={(value) => {
                dispatch({ type: "type", value: value });
              }}
            >
              {CHANNELS.map((item) => (
                <Option key={item.key} value={item.key}>
                  {item?.icon && (
                    <Icon
                      style={{ fontSize: 16, marginRight: 8 }}
                      component={item.icon}
                    />
                  )}
                  {item.name}
                </Option>
              ))}
            </Select>
            <div style={{ width: 500, flex: "1 1 auto" }}>
              <Search
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

            {hasAuthority("alerting.channel:all") ? (
              <>
                <Button
                  icon="upload"
                  onClick={() => {
                    setImportVisible(true);
                  }}
                >
                  {formatMessage({ id: "app.action.import" })}
                </Button>
                <Import
                  title={formatMessage({
                    id: "alert.channel.export-import.label",
                  })}
                  visible={importVisible}
                  onSuccess={refresh}
                  onClose={() => setImportVisible(false)}
                />
                <Export
                  title={formatMessage({
                    id: "alert.channel.export-import.label",
                  })}
                  visible={exportVisible}
                  onSuccess={() => {}}
                  onClose={() => setExportVisible(false)}
                  types={[
                    {
                      type: "AlertChannel",
                      isMain: true,
                      filter:
                        selectedRows.rowKeys.length > 0
                          ? {
                              terms: {
                                id: selectedRows.rowKeys,
                              },
                            }
                          : null,
                    },
                    {
                      type: "EmailServer",
                    },
                  ]}
                />
                <Button
                  icon="plus"
                  type="primary"
                  onClick={() => router.push(`/alerting/channel/new`)}
                >
                  {formatMessage({ id: "form.button.new" })}
                </Button>
                <Dropdown overlay={batchMenu}>
                  <Button type="primary">
                    {formatMessage({ id: "form.button.batch_actions" })}{" "}
                    <Icon type="down" />
                  </Button>
                </Dropdown>
              </>
            ) : null}
          </div>
        </div>
        <Table
          size={"small"}
          loading={loading}
          dataSource={dataSource?.data}
          rowKey={"id"}
          pagination={{
            size: "small",
            pageSize: queryParams.size,
            total: dataSource?.total?.value || dataSource?.total,
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
