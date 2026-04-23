import { Modal, Button, message } from "antd";
import { useEffect, useState } from "react";
import { formatMessage } from "umi/locale";
import SourceIndices from "./SourceIndices";

const SelectIndices = ({
  clusterSelected,
  selectedIndicesRowKeys,
  onIndicesChange,
}) => {
  const [modalVisible, setModalVisible] = React.useState(false);
  const [isSelectRowChange, setIsSelectRowChange] = React.useState(false);
  const [pendingSelectedRowKeys, setPendingSelectedRowKeys] = useState(
    selectedIndicesRowKeys || []
  );
  const [pendingSelectedRows, setPendingSelectedRows] = useState({});

  useEffect(() => {
    if (!modalVisible) {
      setPendingSelectedRowKeys(selectedIndicesRowKeys || []);
    }
  }, [modalVisible, selectedIndicesRowKeys]);

  const showModal = () => {
    if (!clusterSelected.source?.id) {
      return message.warning(formatMessage({ id: "migration.warning.select_source_cluster" }));
    }
    if (!clusterSelected.target?.id) {
      return message.warning(formatMessage({ id: "migration.warning.select_target_cluster" }));
    }
    setIsSelectRowChange(false);
    setPendingSelectedRowKeys(selectedIndicesRowKeys || []);
    setPendingSelectedRows({});
    setModalVisible(true);
  };

  const handleOk = (e) => {
    setModalVisible(false);
    if (isSelectRowChange) {
      const newRows = pendingSelectedRowKeys.map((key) => {
        const row = pendingSelectedRows[key] || { index: key, docs_count: 0 };
        return {
          sourceIndex: row.index || "N/A",
          sourceDocuments: row.docs_count || 0,
          sourceDocType: "",
          targetIndex: row.index || "N/A",
          targetDocuments: 0,
          targetDocType: "",
        };
      });
      onIndicesChange(newRows);
    }
  };
  const handleCancel = (e) => {
    setIsSelectRowChange(false);
    setModalVisible(false);
  };

  const onSelectRowsChange = ({ selectedRowKeys, selectedRows }) => {
    setIsSelectRowChange(true);
    setPendingSelectedRowKeys(selectedRowKeys);
    setPendingSelectedRows(selectedRows);
  };

  return (
    <div>
      <div style={{ padding: "10px 0" }}>
        <strong>{formatMessage({ id: "migration.label.select_indices" })}</strong>
      </div>

      <Button type="primary" onClick={showModal}>
        {formatMessage({ id: "migration.button.select_indices_to_migrate" })}
      </Button>
      <Modal
        title={formatMessage({ id: "migration.label.select_indices" })}
        visible={modalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        width={800}
      >
        <SourceIndices
          key={clusterSelected?.source?.id || "source-indices"}
          clusterID={clusterSelected?.source?.id}
          onSelectChange={onSelectRowsChange}
          selectedIndicesRowKeys={pendingSelectedRowKeys}
        />
      </Modal>
    </div>
  );
};

export default SelectIndices;
