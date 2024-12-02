import ChannelForm from "./Form";
import { Form, Spin, message } from "antd";
import { useCallback, useMemo } from "react";
import useFetch from "@/lib/hooks/use_fetch";
import request from "@/utils/request";
import { router } from "umi";
import { formatMessage } from "umi/locale";

export default Form.create({ name: "channel_form_edit" })((props) => {
  const { match } = props;
  const channelID = match.params.channel_id;
  const { loading, error, value } = useFetch(
    `/alerting/channel/${channelID}`,
    null,
    []
  );

  const onSaveClick = useCallback(
    async (values) => {
      let newVal = {
        ...value._source,
        ...values,
      };

      const saveRes = await request(`/alerting/channel/${channelID}`, {
        method: "PUT",
        body: newVal,
      });
      if (saveRes && saveRes.result == "updated") {
        message.success(
          formatMessage({
            id: "app.message.save.success",
          })
        );
        setTimeout(() => {
          router.push("/alerting/channel");
        }, 1000);
      }
    },
    [value]
  );

  const [editValue] = useMemo(() => {
    let editValue = value?._source || {};
    return [editValue];
  }, [value]);

  if (loading || error) {
    return null;
  }

  return (
    <ChannelForm
      {...props}
      title={formatMessage({ id: "alert.channel.form.title.edit" })}
      onSaveClick={onSaveClick}
      value={editValue}
    />
  );
});
