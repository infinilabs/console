import RuleForm from "./Form";
import { Form } from "antd";
import { useCallback, useState } from "react";
import request from "@/utils/request";
import { message } from "antd";
import { router } from "umi";
import { ESPrefix } from "@/services/common";
import { formatMessage } from "umi/locale";

export default Form.create({ name: "rule_form_new" })((props) => {
  const [submitLoading, setSubmitLoading] = useState(false)
  const onSaveClick = useCallback(async (values) => {
    setSubmitLoading(true)
    const saveRes = await request(`/alerting/rule`, {
      method: "POST",
      body: values,
    });
    if (saveRes && saveRes.result == "created") {
      message.success(
        formatMessage({
          id: "app.message.save.success",
        })
      );
      setTimeout(() => {
        router.push("/alerting/rule");
      }, 1000);
    } else {
      message.error(
        formatMessage({
          id: "app.message.save.failed",
        })
      );
      console.log("Save failed:", saveRes);
    }
    setSubmitLoading(false)
  }, []);
  return (
    <RuleForm
      {...props}
      onSaveClick={onSaveClick}
      title={formatMessage({ id: "alert.rule.form.title.create" })}
      submitLoading={submitLoading}
    />
  );
});
