import { Table } from "antd";
import { formatMessage } from "umi/locale";

const Variables = (props) => {
  const columns = [
    {
      title: "Name",
      dataIndex: "name",
    },
    {
      title: "Type",
      dataIndex: "type",
    },
    {
      title: "Description",
      dataIndex: "description",
    },
    {
      title: "eg",
      dataIndex: "eg",
    },
  ];
  const data = [
    {
      name: "rule_id",
      type: "string",
      description: "rule uuid",
      eg: "c9f663tath2e5a0vksjg",
    },
    {
      name: "rule_name",
      type: "string",
      description: "rule name",
      eg: "High CPU usage",
    },
    {
      name: "resource_id",
      type: "string",
      description: "resource uuid",
      eg: "c9f663tath2e5a0vksjg",
    },
    {
      name: "resource_name",
      type: "string",
      description: "resource name",
      eg: "es-v716",
    },
    {
      name: "event_id",
      type: "string",
      description: "identifier for check details",
      eg: "c9f663tath2e5a0vksjx",
    },
    {
      name: "timestamp",
      type: "date",
      description: "",
      eg: "2022-05-11T11:50:55+08:00",
    },
    {
      name: "first_group_value",
      type: "string",
      description: "The first value of group_values",
      eg: "c9aikmhpdamkiurn1vq0",
    },
    {
      name: "first_threshold",
      type: "string",
      description: "The first value of threshold",
      eg: "90",
    },
    {
      name: "priority",
      type: "string",
      description: "",
      eg: "error",
    },
    {
      name: "title",
      type: "string",
      description: "event title",
      eg: "node {{.first_group_value}} disk used 90%",
    },

    {
      name: "message",
      type: "string",
      description: "event content",
      eg: "EventID：{{.event_id}}; Cluster：{{.resource_name}}",
    },
    {
      name: "results",
      type: "array",
      description: "results",
      properties: [],
    },
    {
      name: "  >  threshold",
      type: "array",
      description: "",
      eg: '["90"]',
    },
    {
      name: "  >  priority",
      type: "string",
      description: "",
      eg: "error",
    },
    {
      name: "  >  group_values",
      type: "array",
      description: "",
      eg: '["cluster-xxx", "node-xxx"]',
    },
    {
      name: "  >  issue_timestamp",
      type: "date",
      description: "",
      eg: "2022-05-11T11:50:55+08:00",
    },
    {
      name: "  >  result_value",
      type: "float",
      description: "",
      eg: "91.2",
    },
    {
      name: "  >  relation_values",
      type: "map",
      description: "",
      eg: "{a:100, b:91.2}",
    },
  ];

  const funcColumns = [
    {
      title: "Function Name",
      dataIndex: "name",
    },
    {
      title: "Params",
      dataIndex: "params",
    },
    {
      title: "Description",
      dataIndex: "description",
    },
  ];

  const funcData = [
    {
      name: "to_fixed",
      params: "固定小数位数",
      description: (
        <span
          dangerouslySetInnerHTML={{
            __html: `字节类型数值格式化<br/>示例：{{.result_value | to_fixed 2}}<br/>输出：10.35`,
          }}
        ></span>
      ),
    },
    {
      name: "format_bytes",
      params: "固定小数位数",
      description: (
        <span
          dangerouslySetInnerHTML={{
            __html: `字节类型数值格式化<br/>示例：{{.result_value | format_bytes 2}}<br/>输出：10.35gb`,
          }}
        ></span>
      ),
    },
    {
      name: "date",
      params: "",
      description: (
        <span
          dangerouslySetInnerHTML={{
            __html: `时间戳转为UTC日期<br/>示例：{{.timestamp | date}}<br/>输出：2022-05-01`,
          }}
        ></span>
      ),
    },
    {
      name: "date_in_zone",
      params: "时区",
      description: (
        <span
          dangerouslySetInnerHTML={{
            __html: `时间戳转为当前区域日期<br/>示例：{{.timestamp | date_in_zone "Asia/Shanghai"}}<br/>输出：2022-05-01`,
          }}
        ></span>
      ),
    },
    {
      name: "datetime",
      params: "",
      description: (
        <span
          dangerouslySetInnerHTML={{
            __html: `时间戳转为UTC时间<br/>示例：{{.timestamp | datetime}}<br/>输出：2022-05-01 10:10:10`,
          }}
        ></span>
      ),
    },
    {
      name: "datetime_in_zone",
      params: "时区",
      description: (
        <span
          dangerouslySetInnerHTML={{
            __html: `时间戳转为当前区域时间<br/>示例：{{.timestamp | datetime_in_zone "Asia/Shanghai"}}<br/>输出：2022-05-01 10:10:10`,
          }}
        ></span>
      ),
    },
    {
      name: "to_lower",
      params: "无",
      description: (
        <span
          dangerouslySetInnerHTML={{
            __html: `转为小写<br/>示例：{{.resource_name | to_lower }}<br/>输出：cluster1`,
          }}
        ></span>
      ),
    },
    {
      name: "to_upper",
      params: "无",
      description: (
        <span
          dangerouslySetInnerHTML={{
            __html: `转为大写<br/>示例：{{.resource_name | to_lower }}<br/>输出：输出：CLUSTER1`,
          }}
        ></span>
      ),
    },
    {
      name: "add",
      params: "数值类型",
      description: (
        <span
          dangerouslySetInnerHTML={{
            __html: `数值相加<br/>示例：{{.result_value | add 1 }}<br/>输出：输出：2`,
          }}
        ></span>
      ),
    },
    {
      name: "sub",
      params: "数值类型",
      description: (
        <span
          dangerouslySetInnerHTML={{
            __html: `数值相减	<br/>示例：{{sub .result_value 1 }}<br/>输出：输出：0`,
          }}
        ></span>
      ),
    },
    {
      name: "mul",
      params: "数值类型",
      description: (
        <span
          dangerouslySetInnerHTML={{
            __html: `数值相乘<br/>示例：{{mul .result_value 3 }}<br/>输出：输出：3`,
          }}
        ></span>
      ),
    },
    {
      name: "div",
      params: "数值类型",
      description: (
        <span
          dangerouslySetInnerHTML={{
            __html: `数值相除<br/>示例：{{div .result_value 2 }}<br/>输出：输出：0.5`,
          }}
        ></span>
      ),
    },
  ];

  return (
    <div>
      <p
        dangerouslySetInnerHTML={{
          __html: formatMessage({ id: "alert.rule.form.title.specification" }),
        }}
      ></p>
      <Table
        columns={columns}
        dataSource={data}
        size="small"
        pagination={false}
      />
      <p style={{ marginTop: "1rem" }}>
        <h2>
          {formatMessage({
            id: "alert.rule.form.title.template_variables_examples",
          })}
        </h2>
      </p>
      <p>
        <div>{formatMessage({ id: "alert.rule.form.title.example1" })}</div>
        <code
          dangerouslySetInnerHTML={{
            __html:
              '{"content":"【Alerting】Event ID: {{.event_id}}, Cluster：{{.resource_name}}"}',
          }}
        ></code>
      </p>
      <p>
        <div>{formatMessage({ id: "alert.rule.form.title.example2" })}</div>
        <code
          dangerouslySetInnerHTML={{
            __html:
              "{{range .results}} Cluster ID: {{index .group_values 0}} {{end}}",
          }}
        ></code>
      </p>

      <p style={{ marginTop: "1rem" }}>
        <h2>
          {formatMessage({ id: "alert.rule.form.title.template_function" })}
        </h2>
      </p>
      <Table
        columns={funcColumns}
        dataSource={funcData}
        size="small"
        pagination={false}
      />
    </div>
  );
};
export default Variables;
