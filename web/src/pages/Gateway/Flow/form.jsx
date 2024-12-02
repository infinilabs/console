import {
  Form,
  Input,
  Switch,
  Select,
  InputNumber,
  Card,
  Button,
  Row,
  Col,
} from "antd";
import { EditFlowUI } from "@/components/infini/flow/EditFlow";
import useFetch from "@/lib/hooks/use_fetch";
import PageHeaderWrapper from "@/components/PageHeaderWrapper";
import "@/assets/headercontent.scss";

const FlowForm = (props) => {
  // const filterMap = {
  //   request_body_json_del: {
  //     properties: {
  //       path: {
  //         type: "array",
  //         sub_type: "string",
  //       },
  //     },
  //   },
  //   request_body_json_set: {
  //     properties: {
  //       path: {
  //         type: "array",
  //         sub_type: "keyvalue",
  //       },
  //     },
  //   },
  //   ldap_auth: {
  //     properties: {
  //       host: {
  //         type: "string",
  //         default_value: "ldap.forumsys.com",
  //       },
  //       port: {
  //         type: "number",
  //         default_value: 389,
  //       },
  //       bind_dn: {
  //         type: "string",
  //       },
  //       bind_password: {
  //         type: "string",
  //       },
  //       base_dn: {
  //         type: "string",
  //       },
  //       user_filter: {
  //         type: "string",
  //       },
  //     },
  //   },
  // };
  const { loading, error, value: filterMap } = useFetch(
    `/gateway/filter/metadata`,
    {},
    []
  );
  if (loading || error) {
    return null;
  }
  return (
    <PageHeaderWrapper>
      <EditFlowUI {...props} filterMap={filterMap} />
    </PageHeaderWrapper>
  );
};

export default FlowForm;
