import { useGlobal } from "@/layouts/GlobalContext";
import request from "@/utils/request";
import { Form, Input, Switch, Icon, Button, Select } from "antd";
import { useMemo, useRef, useState } from "react";
import { Link, router } from "umi";
import { formatMessage } from "umi/locale";
import ClusterSelect from "@/components/ClusterSelect";

export default ({ onEnroll, loading }) => {
  const { clusterList = [], clusterStatus } = useGlobal();

  const [selectedCluster, setSelectedCluster] = useState([]);

  const onEnrollClick = () => {
    if (typeof onEnroll === "function") {
      onEnroll(selectedCluster.map((item) => item.id));
    }
  };

  return (
    <div>
      <div
        style={{ fontSize: 20, color: "rgb(0, 127, 255)", marginBottom: 15 }}
      >
        {formatMessage({
          id: "agent.instance.associate.tips.associate",
        })}
      </div>
      <div>
        <ClusterSelect
          mode={"multiple"}
          width={"100%"}
          dropdownWidth={400}
          selectedCluster={selectedCluster}
          clusterList={clusterList}
          clusterStatus={clusterStatus}
          onChange={(item) => {
            setSelectedCluster(item);
          }}
        />
      </div>
      <div style={{ marginTop: 10, textAlign: "right" }}>
        <div style={{ marginBottom: 15, color: "rgba(130,129,136,1)" }}>
          <span>
            {formatMessage({
              id: "agent.instance.associate.tips.metric",
            })}
          </span>
        </div>
        <Button
          type="primary"
          disabled={clusterList.length === 0}
          onClick={onEnrollClick}
          loading={loading}
        >
          {formatMessage({ id: "agent.instance.table.operation.associate" })}
        </Button>
      </div>
    </div>
  );
};
