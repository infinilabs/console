import ChannelForm from "./Form";
import { Form } from "antd";
import { useCallback } from "react";
import request from "@/utils/request";
import { message } from "antd";
import { router } from "umi";
import { ESPrefix } from "@/services/common";
import { formatMessage } from "umi/locale";

export default Form.create({ name: "channel_form_new" })((props) => {
  const onSaveClick = useCallback(async (values) => {
    const saveRes = await request(`/alerting/channel`, {
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
        router.push("/alerting/channel");
      }, 1000);
    } else {
      message.error(
        formatMessage({
          id: "app.message.save.failed",
        })
      );
      console.log("Save failed:", saveRes);
    }
  }, []);

  return (
    <ChannelForm
      {...props}
      onSaveClick={onSaveClick}
      title={formatMessage({ id: "alert.channel.form.title.create" })}
    />
  );
});
