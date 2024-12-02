import RouterForm from "./form";
import { Form, message } from "antd";
import { useCallback } from "react";
import request from "@/utils/request";
import { router } from "umi";

export default Form.create({ name: "router_form_new" })((props) => {
  const onSaveClick = useCallback(async (values) => {
    const saveRes = await request(`/gateway/router`, {
      method: "POST",
      body: values,
    });
    if (saveRes && saveRes.result == "created") {
      message.success("save succeed");
      router.push("/gateway/router");
    }
  }, []);
  return <RouterForm {...props} title="新建路由" onSaveClick={onSaveClick} />;
});
