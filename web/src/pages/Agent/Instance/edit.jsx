import InstanceForm from "./form";
import { Form, Spin, message } from "antd";
import { useCallback } from "react";
import useFetch from "@/lib/hooks/use_fetch";
import request from "@/utils/request";
import { isTLS, addHttpSchema } from "@/utils/utils";
import { router } from "umi";
import { formatMessage } from "umi/locale";

export default Form.create({ name: "instance_form_edit" })((props) => {
  const { match } = props;
  const { loading, error, value } = useFetch(
    `/instance/${match.params.instance_id}`,
    null,
    []
  );
  const onSaveClick = useCallback(
    async (values) => {
      values.endpoint = addHttpSchema(values.endpoint, values.isTLS);
      let newVal = {
        ...value._source,
        ...values,
      };
      const saveRes = await request(
        `/instance/${match.params.instance_id}`,
        {
          method: "PUT",
          body: newVal,
        }
      );
      if (saveRes && saveRes.result == "updated") {
        message.success("save succeed");
        router.push("/resource/agent");
      }
      // console.log(newVal);
    },
    [value]
  );
  if (loading || error) {
    return null;
  }
  return (
    <InstanceForm
      {...props}
      title={formatMessage({
        id: "gateway.instance.edit.title",
      })}
      onSaveClick={onSaveClick}
      value={value?._source}
    />
  );
});
