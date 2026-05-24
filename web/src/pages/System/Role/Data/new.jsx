import DataRoleForm from "./form";
import { Form } from "antd";
import { useCallback, useState } from "react";
import request from "@/utils/request";
import { router } from "umi";
import { formatMessage } from "umi/locale";

export default Form.create({ name: "data_role_form_new" })((props) => {
  const [createResult, setCreateResult] = useState(null);
  const onSaveClick = useCallback(async (values) => {
    const saveRes = await request(`/role/elasticsearch`, {
      method: "POST",
      body: {
        ...values,
      },
    });
    if (saveRes && saveRes.result == "created") {
      setCreateResult(saveRes);
    }
  }, []);
  return (
    <DataRoleForm
      {...props}
      mode="new"
      createResult={createResult}
      onContinueCreate={() => {
        props.form.resetFields();
        setCreateResult(null);
      }}
      onSaveClick={onSaveClick}
      title="Create Data Role"
    />
  );
});
