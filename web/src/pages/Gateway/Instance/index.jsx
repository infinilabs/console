import PageHeaderWrapper from "@/components/PageHeaderWrapper";
import { Button, Dropdown, Icon, Menu, message, Modal, Tooltip } from "antd";
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
import Wizard from "./Wizard";
import { isNumber } from "lodash";
import { getSystemClusterID } from "@/utils/setup";

const metricTransitionStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  transition: "color 0.2s ease, opacity 0.2s ease",
};

const metricLoadingStyle = {
  ...metricTransitionStyle,
  color: "rgba(0, 0, 0, 0.45)",
};

const metricValueStyle = {
  ...metricTransitionStyle,
  color: "rgba(0, 0, 0, 0.85)",
};

const metricUnavailableStyle = {
  ...metricTransitionStyle,
  color: "#cf1322",
};

export default (props) => {
  const ref = useRef(null);
  const [isLoading, setIsLoading] = React.useState();

  const clusterID = getSystemClusterID();
  const collectionName = "gateway";
  const timeField = "updated";

  const fetchInstanceStats = async (dataSource) => {
    let ids = dataSource?.data?.map((item) => {
      return item.id;
    });
    if (!ids || ids.length == 0) {
      return;
    }
    let res = await request(`/instance/stats`, {
      method: "POST",
      body: ids,
    });

    if (res && !res.error) {
      let tableData = dataSource?.data?.map((item) => {
        return {
          ...item,
          info: res?.[item.id] || {},
          statsFetched: true,
        };
      });
      dataSource.data = tableData;
      if (ref.current?.setDataSource) {
        ref.current.setDataSource({ ...dataSource, data: tableData });
      }
      return;
    }

    const tableData = dataSource?.data?.map((item) => {
      return {
        ...item,
        info: item.info || {},
        statsFetched: true,
      };
    });
    if (ref.current?.setDataSource) {
      ref.current.setDataSource({ ...dataSource, data: tableData });
    }
  };

  const onDeleteClick = useCallback(async (id) => {
    const res = await request(`/instance/${id}`, {
      method: "DELETE",
    });
    if (res && res.result == "deleted") {
      message.success(
        formatMessage({
          id: "app.message.delete.success",
        })
      );
      setIsLoading(true);
      setTimeout(() => {
        ref.current?.refresh();
      }, 1000);
    }
  }, []);

  const showDeleteConfirm = useCallback((record) => {
    Modal.confirm({
      title: formatMessage({ id: "gateway.instance.delete.confirm.title" }),
      content: (
        <>
          <div>
            {formatMessage({ id: "gateway.instance.column.name" })}: {record.name}
          </div>
          <div>
            {formatMessage({ id: "gateway.instance.column.endpoint" })}:{" "}
            {record.endpoint}
          </div>
        </>
      ),
      okText: formatMessage({ id: "form.button.ok" }),
      okType: "danger",
      cancelText: formatMessage({ id: "form.button.cancel" }),
      onOk() {
        onDeleteClick(record.id);
      },
    });
  }, []);

  const formatTableData = async (value) => {
    let dataNew = formatESSearchResult(value);
    dataNew.data = (dataNew.data || []).map((item) => {
      return {
        ...item,
        info: item.info || {},
        statsFetched: false,
      };
    });
    //异步加载&更新扩展数据
    fetchInstanceStats(dataNew);
    return dataNew;
  };

  const renderPendingMetric = (icon = "loading") => {
    return (
      <span style={metricLoadingStyle}>
        <Icon type={icon} />
        <span>--</span>
      </span>
    );
  };

  const renderUnavailableMetric = (icon = "warning") => {
    return (
      <span style={metricUnavailableStyle}>
        <Icon type={icon} />
        <span>--</span>
      </span>
    );
  };

  const renderMetricValue = (icon, value, color) => {
    return (
      <span style={metricValueStyle}>
        <Icon type={icon} style={{ color }} />
        <span>{value}</span>
      </span>
    );
  };

  const columns = [
    {
      title: formatMessage({ id: "gateway.instance.column.application" }),
      key: "application.name",
      sortable: true,
      searchable: true,
      aggregable: true,
    },
    {
      title: formatMessage({ id: "gateway.instance.column.name" }),
      key: "name",
      sortable: true,
      searchable: true,
    },
    {
      title: formatMessage({ id: "gateway.instance.column.endpoint" }),
      key: "endpoint",
      sortable: true,
      searchable: true,
    },
      {
        title: formatMessage({ id: "gateway.instance.column.status" }),
        key: "info.system",
        render: (text, record) => {
          if (!record.statsFetched) {
            return (
              <span style={metricLoadingStyle}>
                <Icon type="loading" />
                <span>
                  {formatMessage({ id: "gateway.instance.status.checking" })}
                </span>
              </span>
            );
          }
          return text ? (
            <span style={{ ...metricValueStyle, color: "#389e0d" }}>
              <Icon type="check-circle" theme="filled" />
              {formatMessage({ id: "gateway.instance.status.online" })}
            </span>
          ) : (
            <span style={metricUnavailableStyle}>
              <Icon type="close-circle" theme="filled" />
              {formatMessage({ id: "gateway.instance.status.unavailable" })}
            </span>
          );
        },
      },
      {
        title: formatMessage({ id: "gateway.instance.column.cpu" }),
        key: "info.system.cpu",
        render: (text, record) => {
          if (!record.statsFetched) {
            return renderPendingMetric();
          }
          return text || isNumber(text)
            ? renderMetricValue("dashboard", `${text}%`, "#1890ff")
            : renderUnavailableMetric();
        },
      },
      {
        title: formatMessage({ id: "gateway.instance.column.memory" }),
        key: "info.system.mem",
        render: (text, record) => {
          if (!record.statsFetched) {
            return renderPendingMetric();
          }
          if (!text) {
            return renderUnavailableMetric();
          }
          const byteFormatted = formatter.bytes(text);
          return renderMetricValue(
            "database",
            byteFormatted.size + byteFormatted.unit,
            "#722ed1"
          );
        },
      },
    {
      title: formatMessage({ id: "gateway.instance.column.storage" }),
      key: "info.disk",
      render: (text, record) => {
        if (!record.statsFetched) {
          return renderPendingMetric();
        }
        if (!text) {
          return renderUnavailableMetric();
        }
        const freeByteFormatted = formatter.bytes(record.info.disk.free);
        const storeByteFormatted = formatter.bytes(record.info.system.store);
        const allByteFormatted = formatter.bytes(record.info.disk.all);
        return (
          <Tooltip
            title={formatMessage(
              { id: "gateway.instance.storage.tooltip" },
              {
                free: `${freeByteFormatted.size}${freeByteFormatted.unit}`,
                total: `${allByteFormatted.size}${allByteFormatted.unit}`,
              }
            )}
          >
            {renderMetricValue(
              "hdd",
              storeByteFormatted.size + storeByteFormatted.unit,
              "#fa8c16"
            )}
          </Tooltip>
        );
      },
    },
    {
      title: formatMessage({ id: "gateway.instance.column.uptime" }),
      key: "info.system.uptime_in_ms",
      render: (text, record) => {
        if (!record.statsFetched) {
          return renderPendingMetric();
        }
        if (!text) {
          return renderUnavailableMetric("clock-circle");
        }
        return renderMetricValue(
          "clock-circle",
          moment.duration(text, "ms").humanize(),
          "#13c2c2"
        );
      },
    },
    {
      title: formatMessage({ id: "gateway.instance.column.tags" }),
      key: "tags",
      aggregable: true,
      searchable: true,
      render: (text, record) => {
        return Array.isArray(text) && text.join(",");
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
            case "delete":
              showDeleteConfirm(record);
              break;
          }
        };

        const menuItems = [
          {
            key: "queue",
            content: (
              <Link to={`/resource/runtime/instance/${record.id}/queue`}>
                {formatMessage({ id: "gateway.instance.menu.queue" })}
              </Link>
            ),
          },
          {
            key: "task",
            content: (
              <Link to={`/resource/runtime/instance/${record.id}/task`}>
                {formatMessage({ id: "gateway.instance.menu.task" })}
              </Link>
            ),
          },
          // {
          //   key: "disk",
          //   content: (
          //     <Link to={`/resource/runtime/instance/${record.id}/disk`}>
          //       Disk
          //     </Link>
          //   ),
          // },
        ];
        if (hasAuthority("gateway.instance:all")) {
          menuItems.push({
            key: "logging",
            content: (
              <Link to={`/resource/runtime/instance/${record.id}/logging`}>
                {formatMessage({ id: "gateway.instance.menu.logging" })}
              </Link>
            ),
          });
          menuItems.push({
            key: "config",
            content: (
              <Link to={`/resource/runtime/instance/${record.id}/config`}>
                {formatMessage({ id: "gateway.instance.menu.config" })}
              </Link>
            ),
          });
          menuItems.push({
            key: "edit",
            content: (
              <Link to={`/resource/runtime/instance/edit/${record.id}`}>
                {formatMessage({ id: "form.button.edit" })}
              </Link>
            ),
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

  const [showEmptyUI, setShowEmptyUI] = useState(false);
  if (showEmptyUI) {
    return <Wizard />;
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
        }}
        sortEnable={true}
        sideEnable={true}
        sideVisible={false}
        sidePlacement="left"
        headerToobarExtra={{
          getExtra: (props) => [
            hasAuthority("gateway.instance:all") ? (
              <Button
                type="primary"
                icon="plus"
                onClick={() => router.push(`/resource/runtime/instance/new`)}
              >
                {formatMessage({ id: "gateway.instance.btn.new" })}
              </Button>
            ) : null,
          ],
        }}
        showEmptyUI={showEmptyUI}
        setShowEmptyUI={setShowEmptyUI}
      />
    </PageHeaderWrapper>
  );
};
