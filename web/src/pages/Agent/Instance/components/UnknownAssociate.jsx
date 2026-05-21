import { useGlobal } from "@/layouts/GlobalContext";
import request from "@/utils/request";
import { Button, Alert } from "antd";
import { useEffect, useState } from "react";
import { formatMessage } from "umi/locale";
import ClusterSelect from "@/components/ClusterSelect";
import SetAgentCredential from "./SetAgentCredential";

export default ({ onBatchEnroll, loading }) => {
  const { clusterList = [] } = useGlobal();
  const [selectedCluster, setSelectedCluster] = useState([]);
  const [auths, setAuths] = useState([]);
  const needCredentialSetup = (item) =>
    !item?.credential_id &&
    !item?.basic_auth?.username &&
    !item?.agent_credential_id &&
    !item?.agent_basic_auth?.username;

  const onBatchEnrollClick = () => {
    if (selectedCluster.length === 0) return;
    const newAuths = [...auths]
    selectedCluster.forEach((item) => {
      if (needCredentialSetup(item)) {
        newAuths.push(item)
      }
    })
    setAuths(newAuths)
    if (newAuths.length === 0 && typeof onBatchEnroll === "function") {
      onBatchEnroll(
        selectedCluster.map((item) => ({
          cluster_id: item.id,
        }))
      );
    }
  };

  useEffect(() => {
    setAuths([])
  }, [JSON.stringify(selectedCluster)])

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
          onChange={(item) => {
            setSelectedCluster(item);
          }}
        />
      </div>
      <SetAgentCredential selectedCluster={selectedCluster} setSelectedCluster={setSelectedCluster}/>
      {
        auths.length > 0 && (
          <Alert style={{ marginTop: 10 }} type="error" message={(
            <div>
              <div>
                {formatMessage({
                  id: "agent.instance.associate.auth.error",
                })}
              </div>
              <div>
                { auths.map((item) => (
                  <div key={item.id}>
                    - {item.name}
                  </div>
                )) }
              </div>
            </div>
          )}/>
        )
      }
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
          onClick={onBatchEnrollClick}
          loading={loading}
        >
          {formatMessage({ id: "agent.instance.table.operation.associate" })}
        </Button>
      </div>
    </div>
  );
};
