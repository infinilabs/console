import UserForm from "./form";
import { Form, Spin, message } from "antd";
import { useCallback, useState } from "react";
import useFetch from "@/lib/hooks/use_fetch";
import request from "@/utils/request";
import { router } from "umi";
import { formatMessage } from "umi/locale";

export default Form.create({ name: "user_form_edit" })((props) => {
  const { match } = props;
  const { loading, error, value } = useFetch(
    `/user/${match.params.user_id}`,
    null,
    []
  );
  // const [isLoading, setIsLoading] = useState(false);
  const onSaveClick = useCallback(
    async (values) => {
      let newVal = {
        ...value._source,
        ...values,
      };
      const saveRes = await request(`/user/${match.params.user_id}`, {
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
    <UserForm
      mode="edit"
      {...props}
      title="Edit User"
      onSaveClick={onSaveClick}
      value={value?._source}
    />
  );
});
