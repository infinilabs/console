import UserForm from "./form";
import { Form } from "antd";
import { useCallback, useState } from "react";
import request from "@/utils/request";
import { message, Result, Button } from "antd";
import { router } from "umi";
import { formatMessage } from "umi/locale";

export default Form.create({ name: "user_form_new" })((props) => {
  const [createResult, setCreateResult] = useState(null);
  const onSaveClick = useCallback(async (values) => {
    const saveRes = await request(`/user`, {
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
      setCreateResult(saveRes);
    }
  }, []);
  return (
    <div>
      <UserForm
        {...props}
        onSaveClick={onSaveClick}
        title="Create User"
        createResult={createResult}
      />
    </div>
  );
});
