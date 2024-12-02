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

export default (props) => {
  const ref = useRef(null);
  const [isLoading, setIsLoading] = React.useState();

  const clusterID = "infini_default_system_cluster";
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
        item.info = res?.[item.id] || {};
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
      title: "Are you sure delete this item?",
      content: (
        <>
          <div>Name: {record.name}</div>
          <div>Endpoint: {record.endpoint}</div>
        </>
      ),
      okText: "Yes",
      okType: "danger",
      cancelText: "No",
      onOk() {
        onDeleteClick(record.id);
      },
    });
  }, []);

  const formatTableData = async (value) => {
    let dataNew = formatESSearchResult(value);
    //异步加载&更新扩展数据
    fetchInstanceStats(dataNew);
    return dataNew;
  };

  const columns = [
    {
      title: "Application",
      key: "application.name",
      sortable: true,
      searchable: true,
      aggregable: true,
    },
    {
      title: "Name",
      key: "name",
      sortable: true,
      searchable: true,
    },
    {
      title: "Endpoint",
      key: "endpoint",
      sortable: true,
      searchable: true,
    },
    {
      title: "Status",
      key: "info.system",
      render: (text, record) => {
        return text ? (
          <span style={{ color: "green" }}>Online</span>
        ) : (
          <span style={{ color: "red" }}>N/A</span>
        );
      },
    },
    {
      title: "CPU",
      key: "info.system.cpu",
      render: (text, record) => {
        return text || isNumber(text) ? `${text}%` : null;
      },
    },
    {
      title: "Memory",
      key: "info.system.mem",
      render: (text, record) => {
        if (!text) {
          return null;
        }
        const byteFormatted = formatter.bytes(text);
        return byteFormatted.size + byteFormatted.unit;
      },
    },
    {
      title: "Storage",
      key: "info.disk",
      render: (text, record) => {
        if (!text) {
          return null;
        }
        const freeByteFormatted = formatter.bytes(record.info.disk.free);
        const storeByteFormatted = formatter.bytes(record.info.system.store);
        const allByteFormatted = formatter.bytes(record.info.disk.all);
        return (
          <Tooltip title={"Free/Total: " + freeByteFormatted.size + freeByteFormatted.unit + "/" + allByteFormatted.size + allByteFormatted.unit}>
            <span>{storeByteFormatted.size + storeByteFormatted.unit}</span>
          </Tooltip>
        )
      },
    },
    {
      title: "Uptime",
      key: "info.system.uptime_in_ms",
      render: (text, record) => {
        if (!text) {
          return null;
        }
        return moment.duration(text, "ms").humanize();
      },
    },
    {
      title: "Tags",
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
                Queue
              </Link>
            ),
          },
          {
            key: "task",
            content: (
              <Link to={`/resource/runtime/instance/${record.id}/task`}>
                Task
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
                Logging
              </Link>
            ),
          });
          menuItems.push({
            key: "config",
            content: (
              <Link to={`/resource/runtime/instance/${record.id}/config`}>
                Config
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
