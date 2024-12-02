import DataRoleForm from "./form";
import { Form } from "antd";
import { useCallback } from "react";
import request from "@/utils/request";
import { message } from "antd";
import { router } from "umi";
import { formatMessage } from "umi/locale";

export default Form.create({ name: "data_role_form_new" })((props) => {
  const onSaveClick = useCallback(async (values) => {
    const saveRes = await request(`/role/elasticsearch`, {
      method: "POST",
      body: {
        ...values,
      },
    });
    if (saveRes && saveRes.result == "created") {
      message.success(
        formatMessage({
          id: "app.message.save.success",
        })
      );
      props.form.resetFields();
    }
  }, []);
  return (
    <DataRoleForm
      {...props}
      onSaveClick={onSaveClick}
      title="Create Data Role"
    />
  );
});
