import PageHeaderWrapper from "@/components/PageHeaderWrapper";
import {
  Button,
  Dropdown,
  Icon,
  Menu,
  message,
  Modal,
  Tag,
  Switch,
} from "antd";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
  Fragment,
} from "react";
import { formatMessage } from "umi/locale";
import { formatESSearchResult } from "@/lib/elasticsearch/util";
import { formatUtcTimeToLocal } from "@/utils/utils";
import ListView from "@/components/ListView";
import router from "umi/router";
import Link from "umi/link";
import request from "@/utils/request";
import moment from "moment";
import { formatter } from "@/lib/format";
import { hasAuthority } from "@/utils/authority";
import { isNumber } from "lodash";
import { RuleStautsColor } from "../utils/constants";
import Import from "../components/Import";
import Export from "../components/Export";
import NoData from "./components/NoData";
import { HealthStatusCircle } from "@/components/infini/health_status_circle";

export default (props) => {
  const ref = useRef(null);
  const [isLoading, setIsLoading] = React.useState();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [importVisible, setImportVisible] = useState(false);
  const [exportVisible, setExportVisible] = useState(false);

  const clusterID = "infini_default_system_cluster";
  const collectionName = "alerting_rule";
  const timeField = "updated"; //timestamp

  const refresh = () => {
    setTimeout(() => {
      ref.current?.refresh();
    }, 1000);
  };

  const fetchRuleInfo = async (dataSource) => {
    let ids = dataSource?.data?.map((item) => {
      return item.id;
    });
    if (!ids || ids.length == 0) {
      return;
    }
    let ruleInfo = await request(`/alerting/rule/info`, {
      method: "POST",
      body: ids,
    });

    if (ruleInfo && !ruleInfo.error) {
      let tableData = dataSource?.data?.map((item) => {
        item.info = ruleInfo?.[item.id] || {};
        return item;
      });
      dataSource.data = tableData;
      // update dataSource
      setTimeout(() => {
        if (ref.current?.setDataSource) {
          ref.current.setDataSource({ ...dataSource, data: tableData });
        }
      }, 500);
    }
  };

  const onClone = useCallback(async (id) => {
    setSubmitLoading(true);
    const info = await request(`/alerting/rule/${id}`);

    if (info?.found) {
      const { _source } = info;
      delete _source.id;
      _source.name = `${_source.name}_Copy`; //rename rule name
      _source.enabled = false; //default enabled:false

      const saveRes = await request(`/alerting/rule`, {
        method: "POST",
        body: [_source],
      });
      if (saveRes && saveRes.result == "created") {
        setSubmitLoading(false);
        message.success(
          formatMessage({
            id: "app.message.operate.success",
          })
        );
        refresh();
        return { acknowledged: true };
      } else {
        console.log("Clone failed,", saveRes);
        message.error(
          formatMessage({
            id: "app.message.operate.failed",
          })
        );
      }
    } else {
      setSubmitLoading(false);
      console.log("Clone failed,", info);
      message.error(
        formatMessage({
          id: "app.message.operate.failed",
        })
      );
    }
    return { acknowledged: false };
  }, []);

  const showCloneConfirm = useCallback(
    (record) => {
      Modal.confirm({
        title: "Are you sure clone this item?",
        content: (
          <ul style={{ listStyle: "initial" }}>
            <li>{record.name}</li>
          </ul>
        ),
        okText: "Yes",
        okType: "primary",
        cancelText: "No",
        onOk() {
          onClone(record.id);
        },
        okButtonProps: { disabled: submitLoading, loading: submitLoading },
      });
    },
    [submitLoading]
  );

  const onDelete = useCallback(async (ids) => {
    const res = await request(`/alerting/rule`, {
      method: "DELETE",
      body: ids,
    });
    if (res && res?.acknowledged) {
      message.success(
        formatMessage({
          id: "app.message.delete.success",
        })
      );
      refresh();
      ref.current?.clearSelectedRows();
    } else {
      console.log("Delete failed,", res);
      message.error(
        formatMessage({
          id: "app.message.delete.failed",
        })
      );
    }
  }, []);

  const showDeleteConfirm = useCallback((record) => {
    Modal.confirm({
      title: "Are you sure delete this item?",
      content: (
        <ul style={{ listStyle: "initial" }}>
          <li>{record.name}</li>
        </ul>
      ),
      okText: "Yes",
      okType: "danger",
      cancelText: "No",
      onOk() {
        onDelete([record.id]);
      },
    });
  }, []);

  const batchDeleteConfirm = useCallback((records) => {
    Modal.confirm({
      title: `Are you sure delete these ${records.length} items?`,
      content: (
        <ul style={{ listStyle: "initial" }}>
          {records.map((item) => {
            return <li key={item.id}>{item.name}</li>;
          })}
        </ul>
      ),
      okText: "Yes",
      okType: "danger",
      cancelText: "No",
      onOk() {
        onDelete(records.map((item) => item.id));
      },
    });
  }, []);

  const onEnableClick = useCallback(async (ids, actionKey) => {
    let actionUrl = "";
    if (actionKey == "enable") {
      actionUrl = "/alerting/rule/_enable";
    } else if (actionKey == "disable") {
      actionUrl = "/alerting/rule/_disable";
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

  const formatTableData = async (value) => {
    let dataNew = formatESSearchResult(value);
    //异步加载&更新扩展数据
    fetchRuleInfo(dataNew);
    return dataNew;
  };

  const columns = [
    {
      title: formatMessage({ id: "alert.rule.table.columnns.category" }),
      key: "category",
      sortable: true,
      searchable: true,
      aggregable: true,
      render: (text, record) => {
        return text ? (
          <Tag style={{ color: "rgb(0, 127, 255)" }}>{text}</Tag>
        ) : (
          <span>{text}</span>
        );
      },
    },
    {
      title: formatMessage({ id: "alert.rule.table.columnns.rule_name" }),
      key: "name",
      sortable: true,
      searchable: true,
      render: (text, record) => {
        return (
          <Link
            key="name"
            to={`/alerting/rule/${record.id}`}
            style={{ display: "flex", alignItems: "center", gap: 5 }}
          >
            <HealthStatusCircle status={RuleStautsColor[record.info?.status]} />
            <span>{text}</span>
          </Link>
        );
      },
    },
    {
      title: formatMessage({ id: "alert.rule.table.columnns.tags" }),
      key: "tags",
      searchable: true,
      render: (text, record) => {
        return record.tags?.map((item) => {
          return (
            <Tag key={item} style={{ color: "rgb(0, 127, 255)" }}>
              {item}
            </Tag>
          );
        });
      },
    },
    {
      title: formatMessage({
        id: "alert.rule.table.columnns.last_notification_time",
      }),
      key: "info.last_notification_time",
      render: (text, record) => (text ? moment(text).fromNow() : text),
    },
    {
      title: formatMessage({ id: "alert.rule.table.columnns.updated" }),
      key: "updated",
      sortable: true,
      render: (text, record) => (
        <span title={text}>{formatUtcTimeToLocal(text)}</span>
      ),
    },
    {
      title: formatMessage({ id: "alert.rule.table.columnns.enabled" }),
      key: "enabled",
      render: (text, record) => {
        return (
          <Switch
            disabled={hasAuthority("alerting.rule:all") ? false : true}
            checked={record.enabled}
            size={"small"}
            onChange={(checked) => {
              onEnableClick([record.id], checked ? "enable" : "disable");
            }}
          />
        );
      },
    },
    {
      title: formatMessage({
        id: "table.field.actions",
      }),
      align: "center",
      render: (text, record) => {
        const onMenuClick = ({ key }) => {
          switch (key) {
            case "clone":
              showCloneConfirm(record);
              break;
            case "delete":
              showDeleteConfirm(record);
              break;
          }
        };

        const menuItems = [];
        if (hasAuthority("alerting.rule:all")) {
          menuItems.push({
            key: "edit",
            content: (
              <Link key="edit" to={`/alerting/rule/edit/${record.id}`}>
                {formatMessage({ id: "form.button.edit" })}
              </Link>
            ),
          });
          menuItems.push({
            key: "clone",
            content: <a>{formatMessage({ id: "form.button.clone" })}</a>,
          });
          menuItems.push({
            key: "delete",
            content: <a>{formatMessage({ id: "form.button.delete" })}</a>,
          });
        }

        const menu = (
          <Menu onClick={onMenuClick}>
            {menuItems.map((item) => {
              return <Menu.Item key={item.key}>{item.content}</Menu.Item>;
            })}
          </Menu>
        );
        return (
          <div>
            <Dropdown overlay={menu}>
              <a
                style={{ fontSize: "20px" }}
                onClick={(e) => e.preventDefault()}
              >
                <Icon type="ellipsis" />
              </a>
            </Dropdown>
          </div>
        );
      },
    },
  ];

  if (!hasAuthority("alerting.rule:all")) {
    columns.splice(columns.length - 1)
  }

  const [showEmptyUI, setShowEmptyUI] = useState(false);
  if (showEmptyUI) {
    return (
      <NoData
        onSuccess={() => {
          window.location.reload();
        }}
      />
    );
  }

  return (
    <PageHeaderWrapper>
      <ListView
        ref={ref}
        clusterID={clusterID}
        collectionName={collectionName}
        columns={columns}
        formatDataSource={(value) => {
          return formatTableData(value);
        }}
        defaultQueryParams={{
          from: 0,
          size: 10,
          sort: [[timeField, "desc"]],
        }}
        sortEnable={true}
        sideEnable={true}
        sideVisible={false}
        sidePlacement="left"
        headerToobarExtra={{
          getExtra: (props) => [
            hasAuthority("alerting.rule:all")
              ? [
                  <>
                    <Button
                      type="primary"
                      icon="upload"
                      onClick={() => {
                        setImportVisible(true);
                      }}
                    >
                      {formatMessage({ id: "app.action.import" })}
                    </Button>
                    <Import
                      title={formatMessage({
                        id: "alert.rule.export-import.label",
                      })}
                      visible={importVisible}
                      onSuccess={refresh}
                      onClose={() => setImportVisible(false)}
                    />
                    <Export
                      title={formatMessage({
                        id: "alert.rule.export-import.label",
                      })}
                      visible={exportVisible}
                      onSuccess={() => {}}
                      onClose={() => setExportVisible(false)}
                      types={[
                        {
                          type: "AlertRule",
                          isMain: true,
                          filter:
                            ref.current?.selectedRows?.rowKeys?.length > 0
                              ? {
                                  terms: {
                                    id: ref.current?.selectedRows.rowKeys,
                                  },
                                }
                              : null,
                        },
                        {
                          type: "AlertChannel",
                        },
                        {
                          type: "EmailServer",
                        },
                      ]}
                    />
                  </>,
                  <Button
                    type="primary"
                    icon="plus"
                    onClick={() => router.push(`/alerting/rule/new`)}
                  >
                    {formatMessage({ id: "form.button.new" })}
                  </Button>,
                ]
              : [],
          ],
        }}
        rowSelectionExtra={{
          getExtra: (props) =>
            hasAuthority("alerting.rule:all")
              ? [
                  <Button
                    type="primary"
                    icon="check-circle"
                    onClick={() => {
                      onEnableClick(
                        ref.current?.selectedRows?.rowKeys,
                        "enable"
                      );
                    }}
                  >
                    {formatMessage({ id: "form.button.enable" })}
                  </Button>,
                  <Button
                    type="danger"
                    icon="stop"
                    onClick={() => {
                      onEnableClick(
                        ref.current?.selectedRows?.rowKeys,
                        "disable"
                      );
                    }}
                  >
                    {formatMessage({ id: "form.button.disable" })}
                  </Button>,
                  <Button
                    type="primary"
                    icon="download"
                    onClick={() => {
                      setExportVisible(true);
                    }}
                  >
                    {formatMessage({ id: "form.button.export" })}
                  </Button>,
                  <Button
                    type="danger"
                    icon="delete"
                    onClick={() => {
                      batchDeleteConfirm(ref.current?.selectedRows?.rows);
                    }}
                  >
                    {formatMessage({ id: "form.button.delete" })}
                  </Button>,
                ]
              : [],
        }}
        showEmptyUI={showEmptyUI}
        setShowEmptyUI={setShowEmptyUI}
      />
    </PageHeaderWrapper>
  );
};
