import RuleForm from "./Form";
import { Form, Spin, message } from "antd";
import { useCallback, useMemo, useState } from "react";
import useFetch from "@/lib/hooks/use_fetch";
import request from "@/utils/request";
import { router } from "umi";
import { formatMessage } from "umi/locale";

export default Form.create({ name: "rule_form_edit" })((props) => {
  const { match } = props;
  const ruleID = match.params.rule_id;
  const [submitLoading, setSubmitLoading] = useState(false)
  const { loading, error, value } = useFetch(
    `/alerting/rule/${ruleID}`,
    null,
    []
  );

  const onSaveClick = useCallback(
    async (values) => {
      setSubmitLoading(true)
      if (value._source.alert_objects) {
        delete value._source.alert_objects;
      }
      const newVal = {
        ...value._source,
        ...values[0],
      };

      const saveRes = await request(`/alerting/rule/${ruleID}`, {
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
          router.push("/alerting/rule");
        }, 1000);
      }
      setSubmitLoading(false)
    },
    [value]
  );

  const formatChannelItems = (items) => {
    return items?.map((item) => {
      const channelItem = item[item.type];
      if (channelItem && channelItem.header_params) {
        const header_params = Array.from(channelItem.header_params)
        const header_params_obj = {};
        header_params.map((hp) => {
          if (hp.key.length && hp.value.length) {
            header_params_obj[hp.key] = hp.value;
          }
        });
        channelItem.header_params = header_params_obj;
        item[item.type] = channelItem;
      }
      return {
        name: item.type,
        ...item,
      };
    });;
  };

  const [editValue] = useMemo(() => {
    let editValue = value?._source || {};
    if (editValue?.metrics && editValue?.conditions) {
      editValue.alert_objects = [
        {
          name: editValue.name,
          metrics: editValue.metrics,
          conditions: editValue.conditions,
          schedule: editValue.schedule,
        },
      ];
      delete editValue.name;
      delete editValue.metrics;
      delete editValue.conditions;
      delete editValue.schedule;
    }
    return [editValue];
  }, [value]);

  if (loading || error) {
    return null;
  }

  return (
    <RuleForm
      {...props}
      title={formatMessage({ id: "alert.rule.form.title.edit" })}
      onSaveClick={onSaveClick}
      value={editValue}
      submitLoading={submitLoading}
    />
  );
});
