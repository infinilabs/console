import EntryForm from "./form";
import { Form } from "antd";
import { useCallback } from "react";
import request from "@/utils/request";
import { message } from "antd";
import { router } from "umi";

export default Form.create({ name: "entry_form_new" })((props) => {
  const onSaveClick = useCallback(async (values) => {
    //remove unfefined value
    let newValues = {};
    for (let key in values) {
      if (typeof values[key] != "undefined") {
        newValues[key] = values[key];
      }
    }
    const saveRes = await request(`/gateway/entry`, {
      method: "POST",
      body: newValues,
    });
    if (saveRes && saveRes.result == "created") {
      message.success("save succeed");
      router.push("/gateway/entry");
    }
  }, []);
  return <EntryForm {...props} title="新建入口" onSaveClick={onSaveClick} />;
});
