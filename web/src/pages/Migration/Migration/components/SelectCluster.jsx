import { Select, Descriptions } from "antd";
import { useCallback, useState, useEffect } from "react";
import { ESPrefix } from "@/services/common";
import request from "@/utils/request";
import { formatter } from "@/utils/format";

const SelectCluster = ({ clusterID, options = [], onChange }) => {
  const onSelectedChange = (value, name, version) => {
    onClusterInfoChange(value);
    if (typeof onChange == "function") {
      onChange(value, name, version);
    }
  };
  const optionsEl = React.useMemo(() => {
    return options.map((op) => {
      return (
        <Select.Option key={op.id} value={op.id} version={op.version}>
          {op.name}
        </Select.Option>
      );
    });
  }, [options]);

  const [clusterInfo, setClusterInfo] = useState({});

  const onClusterInfoChange = async (clusterID) => {
    if (!clusterID) {
      setClusterInfo({});
      return;
    }
    const res = await request(`${ESPrefix}/${clusterID}/metrics`);
    setClusterInfo(res?.summary || {});
  };

  useEffect(() => {
    if (clusterID) {
      onClusterInfoChange(clusterID);
    }
  }, [clusterID]);

  return (
    <div>
      <Select
        allowClear
        showSearch
        onChange={(value, option) => {
          if (value) {
            onSelectedChange(
              value,
              option.props.children,
              option.props.version
            );
          } else {
            onSelectedChange("", "", "");
          }
        }}
        filterOption={(input, option) =>
          option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
        }
        placeholder={"Select a cluster"}
        value={clusterID}
      >
        {optionsEl}
      </Select>
      <div style={{ marginTop: 10, padding: 10 }} className="ant-card-bordered">
        <Descriptions size={"small"}>
          <Descriptions.Item label="Version">
            {clusterInfo?.version?.[0]}
          </Descriptions.Item>
          <Descriptions.Item label="Indices">
            {clusterInfo?.indices_count}
          </Descriptions.Item>
          <Descriptions.Item label="Docs">
            {formatter.number(clusterInfo?.document_count)}
          </Descriptions.Item>
          <Descriptions.Item label="Nodes">
            {clusterInfo?.nodes_count}
          </Descriptions.Item>
          <Descriptions.Item label="Shards">
            {clusterInfo?.total_shards}
          </Descriptions.Item>
          <Descriptions.Item label="Disk Usage">
            {formatter.bytes(clusterInfo?.used_store_bytes || 0)}
          </Descriptions.Item>
        </Descriptions>
      </div>
    </div>
  );
};

export default SelectCluster;
