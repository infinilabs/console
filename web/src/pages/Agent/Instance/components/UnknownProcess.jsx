import { Table, Drawer } from "antd";
import { useMemo, useState } from "react";
import { formatMessage } from "umi/locale";
import { Editor } from "@/components/monaco-editor";

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
      title: "PID",
      dataIndex: "pid",
      ellipsis: true,
      width: 150,
    },
    {
      title: "Name",
      dataIndex: "name",
      ellipsis: true,
      width: 150,
    },
    {
      title: "Cmdline",
      dataIndex: "cmdline",
      render: (text, record) => {
        let lines = text?.split(" ");
        let newLines = lines.slice(0, 4);
        return (
          <>
            {newLines.map((item) => {
              return (
                <div key={item}>
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
          </>
        );
      },
      ellipsis: true,
    },
    {
      title: "Listen addresses",
      dataIndex: "listen_addresses",
      render: (text, record) => (
        <>
          {Array.isArray(text) &&
            text.map((item, index) => {
              return (
                <span key={index}>
                  {item.ip}:{item.port}
                  <br />
                </span>
              );
            })}
        </>
      ),
      ellipsis: true,
      width: 300,
    },
    {
      title: formatMessage({ id: "table.field.actions" }),
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
      ellipsis: true,
      width: 100,
    },
  ];

  return (
    <div>
      <Table
        size={"small"}
        bordered
        loading={loading}
        dataSource={data}
        rowKey={"pid"}
        pagination={{
          size: "small",
          showSizeChanger: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} items`,
        }}
        columns={columns}
      />
      <Drawer
        title={"Processes detail"}
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
