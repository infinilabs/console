import { useRef, useCallback, useState, useEffect } from "react";
import { Button, Dropdown, Icon, Menu, Modal, Drawer, Descriptions } from "antd";
import { formatMessage } from "umi/locale";

import { formatESSearchResult } from "@/lib/elasticsearch/util";
import { formatUtcTimeToLocal } from "@/utils/utils";
import { hasAuthority } from "@/utils/authority";
import request from "@/utils/request";

import PageHeaderWrapper from "@/components/PageHeaderWrapper";
import ListView from "@/components/ListView";
import styles from './index.less';
import { getSystemClusterID } from "@/utils/setup";

export default (props) => {
  const listViewRef = useRef(null);
  const clusterID = getSystemClusterID();
  const collectionName = "audit_log";
  const timeField = "timestamp"; //timestamp

  const [visible, setVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState();

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
      title: "TYPE",
      key: "metadata.log_type",
      aggregable: true,
      searchable: true,
      visible: false,
    },
    {
      title: "OPERATION",
      key: "metadata.labels.operation",
      aggregable: true,
      searchable: true,
      visible: false,
    },
    {
      title: formatMessage({
        id: "audit.logs.table.column.time",
      }),
      key: "timestamp",
      sortable: true,
      defaultSortOrder: 'descend',
      render: (text, record) => {
        return formatUtcTimeToLocal(record.timestamp);
      },
    },
    {
      title:  formatMessage({
        id: "audit.logs.table.column.operator",
      }),
      key: "metadata.operator",
      sortable: false,
      render: (text, record) => {
        return text;
      },
    },
    {
      title: formatMessage({
        id: "audit.logs.table.column.type",
      }),
      key: "metadata.log_type",
      searchable: true,
      sortable: false,
      render: (text, record) => {
        return text;
      },
    },
    {
      title:  formatMessage({
        id: "audit.logs.table.column.resource",
      }),
      key: "metadata.resource_type",
      sortable: false,
      render: (text, record) => {
        return text;
      },
    },
    {
      title: formatMessage({
        id: "audit.logs.table.column.event",
      }),
      key: "metadata.labels.event_name",
      sortable: false,
      render: (text, record) => {
        return  <Button
          type="link"
          onClick={() => {
            setSelectedItem(record);
            setVisible(true);
          }}>
            {text}
          </Button>;
      },
    },
  ];
  const downloadFile = (data, type, filename) => {
    const ele_a = document.createElement('a')
    ele_a.style.display = 'none'
    const blob = new Blob([JSON.stringify(data)], {type: type})
    ele_a.href = URL.createObjectURL(blob)
    ele_a.download = filename
    document.body.appendChild(ele_a)
    ele_a.click()
    document.body.removeChild(ele_a)
  }
  const exportClick = () => {
    const selectedRows =  listViewRef.current?.selectedRows.rows || []
    downloadFile(selectedRows, 'text/plain', 'audit_log.json')
  }
  
  return (
    <PageHeaderWrapper>
      <ListView
        ref={listViewRef}
        clusterID={clusterID}
        collectionName={collectionName}
        viewLayout="table"
        columns={columns}
        formatDataSource={(value) => {
          return formatTableData(value);
        }}
        defaultQueryParams={{
          from: 0,
          size: 10,
          timeRange: { from: "now-7d", to: "now", timeField: timeField },
          sort: [[timeField, "desc"]],
        }}
        dateTimeEnable={true}
        isRefreshPaused={true}
        sortEnable={true}
        sideEnable={true}
        sideVisible={true}
        sidePlacement="left"
        rowSelectionExtra={{
          getExtra: (props) => [
            <Button
              type="primary"
              onClick={exportClick}
            >
              {formatMessage({ id: "form.button.export" })}
            </Button>,
          ],
        }}
      />
      {selectedItem?<Drawer
        width={640}
        onClose={() => {
          setVisible(false);
        }}
        visible={visible}
        title={''}
        destroyOnClose
      >
        <div className={styles.drawerMsg}>
          <div className={styles.title}>基本信息</div>
          <div className={styles.itemBox}>
            <div className={styles.item}>
              <div className={styles.label}>事件名称</div>
              <div className={styles.value}>{selectedItem.metadata.labels.event_name  || '-'}</div>
            </div>
            <div className={styles.item}>
              <div className={styles.label}>事件时间</div>
              <div className={styles.value}>{formatUtcTimeToLocal(selectedItem.timestamp)}</div>
            </div>
            <div className={styles.item}>
              <div className={styles.label}>事件源 IP</div>
              <div className={styles.value}>{selectedItem.metadata.labels.event_source_ip  || '-'}</div>
            </div>
            <div className={styles.item}>
              <div className={styles.label}>操作者</div>
              <div className={styles.value}>{selectedItem.metadata.operator  || '-'}</div>
            </div>
          </div>
        </div>
        <div className={styles.drawerMsg}>
          <div className={styles.title}>相关资源</div>
          <div className={styles.verticalBox}>
            <div className={styles.vertical}>
              <div className={styles.label}>资源类型</div>
              <div className={styles.value}>{selectedItem.metadata.resource_type || '-'}</div>
            </div>
            <div className={styles.vertical}>
              <div className={styles.label}>资源名称</div>
              <div className={styles.value}>{selectedItem.metadata.labels.resource_name || '-'}</div>
            </div>
            <div className={styles.vertical}>
              <div className={styles.label}>操作</div>
              <div className={styles.value}>{selectedItem.metadata.labels.operation || '-'}</div>
            </div>
          </div>
        </div>
        <div className={styles.drawerMsg}>
          <div className={styles.title}>事件记录</div>
          {selectedItem.metadata.labels.event_record ? 
            <div className={styles.eventBox}>{selectedItem.metadata.labels.event_record}</div>
            : <div className={styles.noData}>暂无记录</div>}
        </div>
      </Drawer>:null}
    </PageHeaderWrapper>
  );
};
