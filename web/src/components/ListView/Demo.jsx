import PageHeaderWrapper from "@/components/PageHeaderWrapper";
import { useRef, useCallback, useState, useEffect } from "react";
import { Button, Dropdown, Icon, Menu, Modal } from "antd";
import { formatMessage } from "umi/locale";
import { formatESSearchResult } from "@/lib/elasticsearch/util";
import { formatUtcTimeToLocal } from "@/utils/utils";
import { hasAuthority } from "@/utils/authority";
import request from "@/utils/request";
import ListView from "@/components/ListView";

export default (props) => {
  const ref = useRef(null);
  const clusterID = "infini_default_system_cluster";
  const collectionName = "index";
  const timeField = "timestamp"; //timestamp
  const [histogramState, setHistogramState] = useState({
    enable: true,
    visible: false,
    widget: {},
  });

  const infos = {};
  const formatTableData = (value) => {
    let dataNew = formatESSearchResult(value);

    let tableData = dataNew?.data?.map((item) => {
      const id = item?.metadata?.index_id;
      const metadata = item?.metadata || {};
      const highlight = item.highlight || {};
      const info = id && infos[id] ? infos[id] : {};
      const summary = info.summary || {};
      const metrics = info.metrics || {};

      const timestamp = item?.timestamp
        ? formatUtcTimeToLocal(item?.timestamp)
        : "N/A";
      const metrics_status = metrics?.status || {};

      return {
        id,
        metadata,
        summary,
        metrics_status,
        timestamp,
        highlight,
      };
    });
    dataNew.data = tableData;
    return dataNew;
  };
  const columns = [
    {
      title: "Cluster",
      key: "metadata.cluster_name",
      aggregable: true,
      visible: false,
    },
    {
      title: "Name",
      key: "metadata.index_name",
      sortable: true,
      searchable: true,
    },
    {
      title: "Health",
      key: "metadata.labels.health_status",
      sortable: true,
      aggregable: true,
      searchable: true,
    },
    {
      title: "State",
      key: "metadata.labels.state",
      aggregable: true,
      searchable: true,
    },
    {
      title: "Timestamp",
      key: "timestamp",
      sortable: true,
      render: (text, record) => {
        return formatUtcTimeToLocal(text);
      },
    },
    {
      title: formatMessage({
        id: "table.field.actions",
      }),
      align: "center",
      render: (text, record) => {
        const onMenuClick = ({ key }) => {
          console.log("Actions Click:", key);
          switch (key) {
            case "delete":
              showDeleteConfirm(record);
              break;
          }
        };
        const menuItems = [
          {
            key: "detail",
            content: <a>{formatMessage({ id: "form.button.detail" })}</a>,
          },
          {
            key: "edit",
            content: formatMessage({ id: "form.button.edit" }),
            disabled: true,
          },
        ];
        if (hasAuthority("gateway.instance:all")) {
          menuItems.push({
            key: "delete",
            content: <a>{formatMessage({ id: "form.button.delete" })}</a>,
          });
        }

        const menu = (
          <Menu onClick={onMenuClick}>
            {menuItems.map((item) => {
              return (
                <Menu.Item
                  key={item.key}
                  disabled={item.disabled ? true : false}
                >
                  {item.content}
                </Menu.Item>
              );
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

  const onDeleteClick = useCallback(async (id) => {
    console.log("onDeleteClick");
    // const res = await request(`/xxx/${id}`, {
    //   method: "DELETE",
    // });
    // if (res && res.result == "deleted") {
    //   message.success(
    //     formatMessage({
    //       id: "app.message.delete.success",
    //     })
    //   );
    //   setTimeout(() => {
    //     ref.current?.refresh();
    //   }, 1000);
    // }
  }, []);

  const showDeleteConfirm = (record) => {
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
  };

  const initHistogramWidget = async () => {
    let res = await request(`/collection/${collectionName}/metadata`);
    let indexName = res?.metadata?.index_name || "";
    if (indexName) {
      let widget = {
        bucket_size: "auto",
        is_stack: true,
        format: {
          type: "number",
          pattern: "0.00a",
        },
        series: [
          {
            metric: {
              formula: "a",
              groups: [
                {
                  field: "metadata.labels.health_status",
                  limit: 10,
                },
              ],
              items: [
                {
                  field: "*",
                  name: "a",
                  statistic: "count",
                },
              ],
              sort: [
                {
                  direction: "desc",
                  key: "_count",
                },
              ],
            },
            queries: {
              cluster_id: clusterID,
              indices: [indexName],
              time_field: timeField,
            },
            type: "date-histogram",
          },
        ],
      };
      setHistogramState((st) => ({ ...st, widget }));
    }
  };
  useEffect(() => {
    if (histogramState.enable) {
      initHistogramWidget();
    }
  }, []);

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
          timeRange: { from: "now-7d", to: "now", timeField: timeField },
        }}
        dateTimeEnable={true}
        isRefreshPaused={true}
        sortEnable={true}
        sideEnable={true}
        sideVisible={true}
        sidePlacement="left"
        histogramEnable={histogramState.enable}
        histogramVisible={histogramState.visible}
        histogramWidget={histogramState.widget}
        headerToobarExtra={{
          getExtra: (props) => [
            <Button
              type="primary"
              icon="plus"
              onClick={() => {
                console.log("Click New");
              }}
            >
              {formatMessage({ id: "form.button.new" })}
            </Button>,
          ],
        }}
        rowSelectionExtra={{
          getExtra: (props) => [
            <Button
              type="danger"
              icon="delete"
              onClick={() => {
                console.log("Click Delete");
                ref.current?.refresh();
              }}
            >
              {formatMessage({ id: "form.button.delete" })}
            </Button>,
          ],
        }}
        onRow={(record, index) => {
          return {
            onClick: (event) => {
              console.log("onRow click:", record);
            },
          };
        }}
      />
    </PageHeaderWrapper>
  );
};
