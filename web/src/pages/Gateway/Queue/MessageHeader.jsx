import { Form, Button, Input, message } from "antd";
import { formatMessage } from "umi/locale";

const MessageHeader = Form.create({ name: "message_header" })((props) => {
  const { getFieldDecorator } = props.form;
  const queueID = props.queue_id || "";
  const gotoOffset = props.gotoOffset || "";
  const setGotoOffset = props.setGotoOffset;

  const handleGoto = () => {
    props.form.validateFields((err, values) => {
      if (!err) {
        const goto_offset = values.goto_offset;
        //判空
        if (goto_offset.replace(/(^s*)|(s*$)/g, "").length == 0) {
          message.warn(
            formatMessage({
              id: "gateway.queue.consumer.reset_offset.offset_required",
            })
          );
          return;
        }
        setGotoOffset(goto_offset);
      }
    });
  };
  return (
    <span
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
      >
      <span>
        {formatMessage({ id: "gateway.queue.message.title" }, { id: queueID })}
      </span>
      <span>
        <Form layout="inline">
          <Form.Item
            label={formatMessage({ id: "gateway.queue.message.goto_offset" })}
          >
            {getFieldDecorator("goto_offset", {
              initialValue: gotoOffset,
              rules: [
                {
                  required: false,
                  message: formatMessage({
                    id: "gateway.queue.consumer.reset_offset.offset_required",
                  }),
                },
              ],
            })(<Input style={{ width: "50%" }} />)}
            <Button
              type="primary"
              onClick={handleGoto}
              style={{ marginLeft: 10 }}
            >
              {formatMessage({ id: "gateway.queue.message.goto" })}
            </Button>
          </Form.Item>
        </Form>
      </span>
    </span>
  );
});
export default MessageHeader;
