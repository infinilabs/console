import { Divider, Icon, Table, Tag } from "antd";
import styles from "./index.scss";
import IndexEditor from "./IndexEditor";
import { formatter } from "@/utils/format";

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
          title: "Index",
          dataIndex: "sourceIndex",
          key: "sourceIndex",
        },
        {
          title: "Type",
          dataIndex: "sourceDocType",
          key: "sourceDocType",
        },
        {
          title: "Documents",
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
          title: "Index",
          dataIndex: "targetIndex",
          key: "targetIndex",
        },
        {
          title: "Type",
          dataIndex: "targetDocType",
          key: "targetDocType",
        },
        {
          title: "Documents",
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
      rowKey={(record) => {
        return (
          record.sourceIndex +
          (record?.sourceDocType ? record.sourceDocType : "")
        );
      }}
      expandedRowRender={expandedRowRender}
    />
  );
};
