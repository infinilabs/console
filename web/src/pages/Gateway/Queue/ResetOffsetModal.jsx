import { Modal, Form, Button, Input, message } from "antd";

import { formatMessage } from "umi/locale";
import useFetch from "@/lib/hooks/use_fetch";
import { useCallback, useEffect, useMemo } from "react";
import request from "@/utils/request";
import { encodeProxyPath } from "@/lib/util";

const ReestOffsetModal = Form.create({ name: "resetoffset" })((props) => {
  const { getFieldDecorator } = props.form;
  const resetOffsetData = props.resetOffsetData;
  const setResetOffsetData = props.setResetOffsetData;
  const handleRefresh = props.handleRefresh;

  const visible = resetOffsetData?.visible || false;
  const queueID = resetOffsetData?.queue_id || "";
  const record = resetOffsetData?.record || {};
  const consumerID = record?.id || "";

  const [confirmLoading, setConfirmLoading] = React.useState(false);

  const hideModal = () => {
    setResetOffsetData({
      ...resetOffsetData,
      visible: false,
    });
  };

  const resetOffset = useCallback(
    async (offset) => {
      const path = encodeProxyPath(`/queue/${queueID}/consumer/${consumerID}/offset`,{offset:offset});
      const resetRes = await request(
        `/instance/${props.gateway_instance_id}/_proxy?method=PUT&path=${path}`,
        {
          method: "POST",
        }
      );
      if (resetRes && resetRes.acknowledged) {
        message.success(
          formatMessage({ id: "gateway.queue.consumer.reset_offset.success" })
        );
        hideModal();
        handleRefresh()
      }
      setConfirmLoading(false);
    },
    [handleRefresh, queueID, consumerID]
  );

  const handleOk = () => {
    setConfirmLoading(true);
    props.form.validateFields((err, values) => {
      if (!err) {
        resetOffset(values.offset);
      } else {
        setConfirmLoading(false);
      }
    });
  };

  function handleCancel() {
    hideModal();
  }

  return (
    <Modal
      destroyOnClose={true}
      title={formatMessage({ id: "gateway.queue.consumer.reset_offset.title" })}
      visible={visible}
      onOk={handleOk}
      confirmLoading={confirmLoading}
      onCancel={handleCancel}
    >
      <div style={{display:"flex", justifyContent:"space-between", gap: "15px", flexWrap: "wrap", marginBottom: 10}}>
        <span>
          <strong>{formatMessage({ id: "table.field.id" })}:</strong>
          {record?.id}
        </span>
        <span>
          <strong>{formatMessage({ id: "gateway.queue.consumer.field.group" })}:</strong>
          {record?.group}
        </span>
        <span>
          <strong>{formatMessage({ id: "table.field.name" })}:</strong>
          {record?.name}
        </span>
        <span>
          <strong>{formatMessage({ id: "gateway.queue.field.offset" })}:</strong>
          {record?.offset}
        </span>
      </div>

      <Form layout="inline">
        <Form.Item label={formatMessage({ id: "gateway.queue.consumer.reset_offset.new_offset" })}>
          {getFieldDecorator("offset", {
            rules: [
              {
                required: true,
                message: formatMessage({
                  id: "gateway.queue.consumer.reset_offset.offset_required",
                }),
              },
            ],
          })(<Input />)}
        </Form.Item>
      </Form>
    </Modal>
  );
});
export default ReestOffsetModal;
