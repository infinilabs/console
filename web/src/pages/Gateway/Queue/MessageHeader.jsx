import { Form, Button, Input, message } from "antd";

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
          message.warn("offset is required!");
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
      <span>{`Message (ID:${queueID})`}</span>
      <span>
        <Form layout="inline">
          <Form.Item label="Go to offset: ">
            {getFieldDecorator("goto_offset", {
              initialValue: gotoOffset,
              rules: [{ required: false, message: "offset is required!" }],
            })(<Input style={{ width: "50%" }} />)}
            <Button
              type="primary"
              onClick={handleGoto}
              style={{ marginLeft: 10 }}
            >
              Goto
            </Button>
          </Form.Item>
        </Form>
      </span>
    </span>
  );
});
export default MessageHeader;
