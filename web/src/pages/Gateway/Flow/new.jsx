import FlowForm from "./form";
import { Form } from "antd";
import { useCallback } from "react";
import request from "@/utils/request";
import { message } from "antd";
import { router } from "umi";

export default Form.create({ name: "flow_form_new" })((props) => {
  const onSaveClick = useCallback(async (values) => {
    const saveRes = await request(`/gateway/flow`, {
      method: "POST",
      body: {
        ...values,
      },
    });
    if (saveRes && saveRes.result == "created") {
      message.success("save succeed");
      router.push("/gateway/flow");
    }
  }, []);
  return <FlowForm {...props} onSaveClick={onSaveClick} title="新建流程" />;
});
