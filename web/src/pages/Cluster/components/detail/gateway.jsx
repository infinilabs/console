import { Empty, Button, Modal } from "antd";
import { GatewayGuide } from "../guide/gateway/gateway";
import { useMemo, useState } from "react";
import { formatMessage } from "umi/locale";

export const Gateway = ({ data }) => {
  const selectCluster = useMemo(() => {
    if (!data) {
      return {};
    }
    return {
      cluster_name: data._source?.name,
      cluster_id: data._id,
    };
  }, [data]);
  const [guidVisible, setGuidVisible] = useState(false);
  return (
    <div>
      <EmptyState
        onGuideClick={() => {
          setGuidVisible(true);
        }}
      />
      <Modal
        zIndex={10002}
        title={formatMessage({ id: "gateway.guide.title" })}
        visible={guidVisible}
        onOk={() => {}}
        onCancel={() => {
          setGuidVisible(false);
        }}
        footer={null}
        destroyOnClose={true}
      >
        <GatewayGuide selectCluster={selectCluster} />
      </Modal>
    </div>
  );
};

const EmptyState = ({ onGuideClick }) => {
  return (
    <div>
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        imageStyle={{
          height: 60,
        }}
        description={<span>{formatMessage({ id: "gateway.guide.no_config.text" })}</span>}
      >
        <Button type="primary" onClick={onGuideClick}>
        {formatMessage({ id: "gateway.guide.button.text" })}
        </Button>
      </Empty>
    </div>
  );
};
