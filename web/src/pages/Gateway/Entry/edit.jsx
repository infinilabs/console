import EntryForm from "./form";
import { Form, message } from "antd";
import { useCallback } from "react";
import useFetch from "@/lib/hooks/use_fetch";
import request from "@/utils/request";
import { router } from "umi";

export default Form.create({ name: "entry_form_edit" })((props) => {
  const { match } = props;
  const { loading, error, value } = useFetch(
    `/gateway/entry/${match.params.entry_id}`,
    null,
    []
  );
  const onSaveClick = useCallback(
    async (values) => {
      // console.log(values);
      let newVal = {
        ...value._source,
        ...values,
      };
      const saveRes = await request(`/gateway/entry/${match.params.entry_id}`, {
        method: "PUT",
        body: newVal,
      });
      if (saveRes && saveRes.result == "updated") {
        message.success("save succeed");
        router.push("/gateway/entry");
      }
    },
    [value]
  );

  if (loading || error) {
    return null;
  }
  return (
    <EntryForm
      {...props}
      title="编辑入口"
      onSaveClick={onSaveClick}
      value={value?._source}
    />
  );
});
