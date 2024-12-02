import RouterForm from "./form";
import { Form, Spin, message } from "antd";
import { useCallback } from "react";
import useFetch from "@/lib/hooks/use_fetch";
import request from "@/utils/request";
import { router } from "umi";

export default Form.create({ name: "router_form_edit" })((props) => {
  const { match } = props;
  const { loading, error, value } = useFetch(
    `/gateway/router/${match.params.router_id}`,
    null,
    []
  );
  const onSaveClick = useCallback(
    async (values) => {
      let newVal = {
        ...value._source,
        ...values,
      };
      const saveRes = await request(
        `/gateway/router/${match.params.router_id}`,
        {
          method: "PUT",
          body: newVal,
        }
      );
      if (saveRes && saveRes.result == "updated") {
        message.success("save succeed");
        router.push("/gateway/router");
      }
      // console.log(newVal);
    },
    [value]
  );
  if (loading || error) {
    return null;
  }
  return (
    <RouterForm
      {...props}
      title="编辑路由"
      onSaveClick={onSaveClick}
      value={value?._source}
    />
  );
});
