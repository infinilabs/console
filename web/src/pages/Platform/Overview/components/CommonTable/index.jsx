import React, { useState, useEffect, useMemo } from "react";
import { Table, Tooltip, Progress } from "antd";
import { formatter } from "@/utils/format";
import { formatUtcTimeToLocal } from "@/utils/utils";
import { formatMessage } from "umi/locale";
import { SearchEngineIcon } from "@/lib/search_engines";
import { HealthStatusView } from "@/components/infini/health_status_view";
import { StatusBlockGroup } from "@/components/infini/status_block";
import { Providers, ProviderIcon } from "@/lib/providers";
import request from "@/utils/request";
import styles from "./index.less"

export default (props) => {
  const {
    dataSource,
    total,
    from,
    pageSize,
    loading,
    onPageChange,
    onPageSizeChange,
    onRowClick,
    infoAction,
    formatData,
    columns = [],
    parentLoading
  } = props;

  const [infos, setInfos] = useState({});

  const fetchListInfo = async (data) => {
    const res = await Promise.all(data?.map((item) => request(infoAction, {
      method: "POST",
      body: [item.id],
    }, false, false)));
    if (res) {
      let newInfos = {}
      res.forEach((item) => {
        if (item && !item.error) {
          newInfos = {
            ...newInfos,
            ...item
          }
        }
      })
      setInfos(newInfos);
    }
  };

  useEffect(() => {
    if (!parentLoading) {
      fetchListInfo(dataSource);
    }
  }, [JSON.stringify(dataSource), parentLoading])

  const tableData = useMemo(() => {
    return formatData(dataSource, infos);
  }, [JSON.stringify(dataSource), JSON.stringify(infos)]);

  return (
    <div className="table-wrap">
      <Table
        size={"small"}
        loading={loading}
        columns={columns}
        dataSource={tableData}
        rowKey={"id"}
        pagination={{
          size: "small",
          total,
          pageSize,
          onChange: onPageChange,
          showSizeChanger: true,
          onShowSizeChange: (_, size) => {
            onPageSizeChange(size);
          },
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} items`,
        }}
        onRow={(record, i) => {
          return {
            onClick: (event) => {
              onRowClick(dataSource[i]);
            },
          };
        }}
        rowClassName={() => styles.rowPointer}
      />
    </div>
  );
};