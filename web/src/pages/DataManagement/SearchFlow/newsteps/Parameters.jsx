import { Button, Input, Switch, Table, Popconfirm, Icon, message } from "antd";
import React, { useRef, useEffect } from "react";
import { formatMessage } from "umi/locale";
import "./Parameters.scss";
export default ({ onChange, parameters }) => {
  const [data, setData] = React.useState(parameters || []);
  useEffect(() => {
    if (typeof onChange == "function") {
      onChange(data);
    }
  }, [data]);
  const columns = [
    {
      title: "Key",
      dataIndex: "key",
    },
    {
      title: "Is Value Parameter",
      dataIndex: "is_value",
      render: (text, record) => <Icon type={`${text ? "check" : "close"}`} />,
    },
    {
      title: formatMessage({ id: "table.field.actions" }),
      render: (text, record) => (
        <div>
          <Popconfirm
            title="Sure to delete?"
            onConfirm={() => handleDeleteClick(record.key)}
          >
            <a>Delete</a>
          </Popconfirm>
        </div>
      ),
    },
  ];
  const handleDeleteClick = (key) => {
    const newData = data.filter((item) => item.key != key);
    setData(newData);
  };
  const inputKeyRef = useRef();
  const isValueRef = useRef();
  const addClick = () => {
    const key = inputKeyRef.current.state.value;
    const titem = data.find((item) => item.key == key);
    if (titem) {
      message.error("parameter key already added");
      return;
    }
    const isValue = isValueRef.current.rcSwitch.state.checked;

    setData([
      ...data,
      {
        key: key,
        is_value: isValue,
      },
    ]);
  };
  return (
    <div className="parameters-cnt">
      <div className="edit-cnt">
        <div className="input-cnt">
          Parameter Key{" "}
          <div>
            <Input ref={inputKeyRef} />
          </div>
        </div>
        <div>
          Is Value Parameter?{" "}
          <Switch
            ref={isValueRef}
            checkedChildren={<Icon type="check" />}
            unCheckedChildren={<Icon type="close" />}
            defaultChecked
          />
        </div>
        <Button type="primary" onClick={addClick}>
          添加
        </Button>
      </div>
      <div>
        <Table
          size={"small"}
          bordered
          dataSource={data}
          rowKey="key"
          columns={columns}
        />
      </div>
    </div>
  );
};
