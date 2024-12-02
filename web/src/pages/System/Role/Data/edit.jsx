import DataRoleForm from "./form";
import { Form, Spin, message } from "antd";
import { useCallback } from "react";
import useFetch from "@/lib/hooks/use_fetch";
import request from "@/utils/request";
import { router } from "umi";
import { formatMessage } from "umi/locale";

export default Form.create({ name: "console_role_form_edit" })((props) => {
  const { match } = props;
  const { loading, error, value } = useFetch(
    `/role/${match.params.role_id}`,
    null,
    []
  );
  const onSaveClick = useCallback(
    async (values) => {
      let newVal = {
        ...value._source,
        ...values,
      };
      const saveRes = await request(`/role/${match.params.role_id}`, {
        method: "PUT",
        body: newVal,
      });
      if (saveRes && saveRes.result == "updated") {
        message.success(
          formatMessage({
            id: "app.message.save.success",
          })
        );
      }
    },
    [value]
  );
  if (loading || error) {
    return null;
  }
  return (
    <DataRoleForm
      mode="edit"
      {...props}
      title="Edit Role"
      onSaveClick={onSaveClick}
      value={value?.hit}
    />
  );
});
