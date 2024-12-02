import { Descriptions } from "antd";
import { formatMessage } from "umi/locale";
import { DATE_FORMAT } from ".";
import moment from "moment";

export default ({ licence }) => {
  const {
    license_type,
    license_id,
    issue_to = "-",
    issue_at,
    valid_from,
    expire_at,
    max_nodes = "-",
  } = licence || {};

  return (
    <Descriptions size="small" title="" column={1}>
      <Descriptions.Item
        label={formatMessage({ id: "license.label.license_type" })}
      >
        {license_type}
      </Descriptions.Item>
      <Descriptions.Item
        label={formatMessage({ id: "license.label.max_nodes" })}
      >
        {max_nodes}
      </Descriptions.Item>
      <Descriptions.Item
        label={formatMessage({ id: "license.label.issue_to" })}
      >
        {issue_to}
      </Descriptions.Item>
      <Descriptions.Item
        label={formatMessage({ id: "license.label.issue_at" })}
      >
        {issue_at ? moment(issue_at).format(DATE_FORMAT) : "-"}
      </Descriptions.Item>
      <Descriptions.Item
        label={formatMessage({ id: "license.label.expire_at" })}
      >
        {expire_at ? moment(expire_at).format(DATE_FORMAT) : "-"}
      </Descriptions.Item>
    </Descriptions>
  );
};
