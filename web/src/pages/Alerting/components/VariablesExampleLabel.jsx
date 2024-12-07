import { Table, Drawer } from "antd";
import { formatMessage } from "umi/locale";
import { getDocPathByLang, getWebsitePathByLang } from "@/utils/utils";
import { useState } from "react";
import TemplateVariables from "./Template/Variables";

const VariablesExampleLabel = (props) => {
  const [varVisible, setVarVisible] = useState(false);
  const docsLink = `${getDocPathByLang()}/reference/alerting/variables`;

  return (
    <>
      <span
        dangerouslySetInnerHTML={{
          __html: `${formatMessage({
            id: "alert.rule.form.title.template_variables_examples",
          })} {{ .event_id }} {{ .resource_name }} {{ .timestamp }}`,
        }}
      ></span>{" "}
      {docsLink ? (
        <a target={"_blank"} href={docsLink}>
          {formatMessage({
            id: "alert.rule.form.title.how_to_use_template_variables",
          })}
        </a>
      ) : (
        <>
          <a
            target={"_blank"}
            onClick={() => {
              setVarVisible(true);
            }}
          >
            {formatMessage({
              id: "alert.rule.form.title.how_to_use_template_variables",
            })}
          </a>
          <Drawer
            title={formatMessage({
              id: "alert.rule.form.title.template_variables",
            })}
            width={800}
            placement="right"
            closable={true}
            onClose={() => setVarVisible(false)}
            visible={varVisible}
          >
            <TemplateVariables />
          </Drawer>
        </>
      )}
    </>
  );
};
export default VariablesExampleLabel;
