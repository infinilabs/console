import { useState } from "react";
import { Button, Drawer, Form, Icon, message } from "antd";
import styles from "./Editer.scss";
import request from "@/utils/request";
import { formatMessage } from "umi/locale";

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 7 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 17 },
  },
};

export default Form.create()(({ title, record, renderFormItems, form }) => {
  const [visible, setVisible] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    form.validateFields(async (err, values) => {
      if (err) {
        return;
      }
      const res = await request(`/migration/migration/${record.id}/info`, {
        method: "PUT",
        body: values,
      });
      if (res?.result === "updated") {
        message.success(
          formatMessage({
            id: "app.message.save.success",
          })
        );
      } else {
        message.error(
          formatMessage({
            id: "app.message.save.failed",
          })
        );
        console.log("Save failed,", res);
      }
    });
  };

  return (
    <>
      <a onClick={() => setVisible(true)}>
        <Icon type="edit" theme="filled" style={{ marginLeft: 8 }} />
      </a>
      <Drawer
        title={title}
        width={640}
        placement="right"
        onClose={() => setVisible(false)}
        visible={visible}
        destroyOnClose
      >
        <div className={styles.form}>
          <Form {...formItemLayout} onSubmit={handleSubmit} colon={false}>
            {renderFormItems({ record, form })}
            <Form.Item label=" ">
              <div style={{ textAlign: "right", marginTop: 30 }}>
                <Button type="primary" htmlType="submit">
                  Save
                </Button>
              </div>
            </Form.Item>
          </Form>
        </div>
      </Drawer>
    </>
  );
});
