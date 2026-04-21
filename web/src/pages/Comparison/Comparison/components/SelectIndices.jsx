import { Modal, Button, message } from "antd";
import { useState } from "react";
import { formatter } from "@/utils/format";
import SourceIndices from "./SourceIndices";

const SelectIndices = ({
  clusterSelected,
  selectedIndicesRowKeys,
  onIndicesChange,
}) => {
  const [modalVisible, setModalVisible] = React.useState(false);
  const [isSelectRowChange, setIsSelectRowChange] = React.useState(false);
  const showModal = () => {
    if (!clusterSelected.source?.id) {
      return message.warning("Please select a source cluster");
    }
    if (!clusterSelected.target?.id) {
      return message.warning("Please select a target cluster");
    }
    setModalVisible(true);
  };

  const handleOk = (e) => {
    setModalVisible(false);
    if (isSelectRowChange) {
      const newRows = selectedRows.map((row) => {
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
    setModalVisible(false);
  };

  const [selectedRows, setSelectedRows] = useState([]);
  const onSelectRowsChange = (selectedRows) => {
    setIsSelectRowChange(true);
    setSelectedRows(selectedRows);
  };

  return (
    <div>
      <div style={{ padding: "10px 0" }}>
        <strong>Select Indices</strong>
      </div>

      <Button type="primary" onClick={showModal}>
        Select indices to compare
      </Button>
      <Modal
        title="Select Indices"
        visible={modalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        width={800}
      >
        <SourceIndices
          clusterID={clusterSelected?.source?.id}
          onSelectChange={onSelectRowsChange}
          selectedIndicesRowKeys={selectedIndicesRowKeys}
        />
      </Modal>
    </div>
  );
};

export default SelectIndices;
