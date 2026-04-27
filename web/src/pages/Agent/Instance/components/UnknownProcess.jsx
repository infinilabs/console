import { Table, Drawer } from "antd";
import { useMemo, useState } from "react";
import { formatMessage } from "umi/locale";
import { Editor } from "@/components/monaco-editor";
import styles from "./RowDetail.less";

export default (props) => {
  const { loading = true, data = [] } = props;

  const [state, setState] = useState({
    drawerVisible: false,
    record: {},
  });

  const onDetailClick = async (record) => {
    console.log("detail:", record);
    setState({ ...state, drawerVisible: !state.drawerVisible, record });
  };

  const columns = [
    {
      title: formatMessage({ id: "table.field.pid" }),
      width: 120,
      dataIndex: "pid",
      render: (text) => <div className={styles.cellWrap}>{text}</div>,
    },
    {
      title: formatMessage({ id: "table.field.name" }),
      width: 140,
      dataIndex: "name",
      render: (text) => <div className={styles.cellWrap}>{text}</div>,
    },
    {
      title: formatMessage({ id: "table.field.cmdline" }),
      dataIndex: "cmdline",
      render: (text, record) => {
        let lines = text?.split(" ");
        let newLines = lines.slice(0, 4);
        return (
          <div className={styles.cellWrap}>
            {newLines.map((item, index) => {
              return (
                <div key={`${item}-${index}`} className={styles.cellWrap}>
                  {item}
                  <br />
                </div>
              );
            })}
            <a
              onClick={() => {
                onDetailClick(record);
              }}
            >
              {formatMessage({
                id: "component.noticeIcon.viewMoreText",
              })}
            </a>
          </div>
        );
      },
    },
    {
      title: formatMessage({ id: "table.field.listen_address" }),
      width: 180,
      dataIndex: "listen_addresses",
      render: (text, record) => (
        <div className={styles.cellWrap}>
          {Array.isArray(text) &&
            text.map((item, index) => {
              return (
                <span key={index}>
                  {item.ip}:{item.port}
                  <br />
                </span>
              );
            })}
        </div>
      ),
    },
    {
      title: formatMessage({ id: "table.field.actions" }),
      width: 100,
      render: (text, record) => (
        <div>
          <a
            onClick={() => {
              onDetailClick(record);
            }}
          >
            {formatMessage({
              id: "agent.instance.table.operation.detail",
            })}
          </a>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.tableWrap}>
      <Table
        size={"small"}
        bordered
        loading={loading}
        dataSource={data}
        rowKey={"pid"}
        tableLayout="fixed"
        pagination={{
          size: "small",
          showSizeChanger: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} items`,
        }}
        columns={columns}
      />
      <Drawer
        title={formatMessage({
          id: "agent.instance.process.detail.title",
        })}
        visible={state.drawerVisible}
        destroyOnClose
        onClose={() => {
          setState((st) => {
            return {
              ...st,
              drawerVisible: false,
            };
          });
        }}
        width={700}
      >
        <Editor
          height="calc(100vh - 100px)"
          language="json"
          theme="light"
          value={JSON.stringify(state.record, null, 2)}
          options={{
            minimap: {
              enabled: false,
            },
            wordBasedSuggestions: true,
          }}
        />
      </Drawer>
    </div>
  );
};
