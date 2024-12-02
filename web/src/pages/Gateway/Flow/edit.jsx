import FlowForm from "./form";
import { Form } from "antd";
import { useCallback } from "react";
import request from "@/utils/request";
import { message } from "antd";
import { router } from "umi";
import useFetch from "@/lib/hooks/use_fetch";

export default Form.create({ name: "flow_form_edit" })((props) => {
  const { match } = props;
  const { loading, error, value } = useFetch(
    `/gateway/flow/${match.params.flow_id}`,
    null,
    []
  );
  const onSaveClick = useCallback(
    async (values) => {
      const saveRes = await request(`/gateway/flow/${match.params.flow_id}`, {
        method: "PUT",
        body: {
          ...value._source,
          ...values,
        },
      });
      if (saveRes && saveRes.result == "updated") {
        message.success("save succeed");
        router.push("/gateway/flow");
      }
    },
    [value]
  );
  if (loading || error) {
    return null;
  }
  const initialValue = value
    ? {
        name: value._source.name,
        filter: value._source.filter,
      }
    : null;
  return (
    <FlowForm
      {...props}
      onSaveClick={onSaveClick}
      initialValue={initialValue}
      title="编辑流程"
    />
  );
});
