import { Divider, Icon, Table, Tag } from "antd";
import styles from "./index.scss";
import IndexEditor from "./IndexEditor";
import { formatter } from "@/utils/format";
import { formatMessage } from "umi/locale";

export default ({
  sourceCluster,
  targetCluster,
  data,
  formatColumns,
  expandedRowRender,
}) => {
  const columns = [
    {
      title: `${sourceCluster}`,
      dataIndex: "sourceCluster",
      children: [
        {
          title: formatMessage({ id: "migration.table.field.index" }),
          dataIndex: "sourceIndex",
          key: "sourceIndex",
        },
        {
          title: formatMessage({ id: "migration.table.field.type" }),
          dataIndex: "sourceDocType",
          key: "sourceDocType",
        },
        {
          title: formatMessage({ id: "migration.setting.documents" }),
          dataIndex: "sourceDocuments",
          key: "sourceDocuments",
          render: (value) =>
            Number.isInteger(value) ? formatter.number(value) : "N/A",
        },
      ],
    },
    {
      title: "",
      dataIndex: "divider",
      width: 50,
      className: styles.divider,
      render: () => ">>",
    },
    {
      title: `${targetCluster}`,
      dataIndex: "targetCluster",
      children: [
        {
          title: formatMessage({ id: "migration.table.field.index" }),
          dataIndex: "targetIndex",
          key: "targetIndex",
        },
        {
          title: formatMessage({ id: "migration.table.field.type" }),
          dataIndex: "targetDocType",
          key: "targetDocType",
        },
        {
          title: formatMessage({ id: "migration.setting.documents" }),
          dataIndex: "targetDocuments",
          key: "targetDocuments",
          render: (value) =>
            Number.isInteger(value) ? formatter.number(value) : "N/A",
        },
      ],
    },
  ];

  return (
    <Table
      size="small"
      className={styles.migrateIndicesTable}
      columns={formatColumns(
        columns.map((item) => ({ ...item, ellipsis: true }))
      )}
      dataSource={data}
      bordered={true}
      pagination={false}
      rowSelection={null}
      rowKey={(record, index) => {
        return `${record.sourceIndex || ""}:${record.sourceDocType || ""}:${record.targetIndex || ""}:${record.targetDocType || ""}:${index}`;
      }}
      expandedRowRender={expandedRowRender}
    />
  );
};
