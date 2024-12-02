import { useCallback, useState, useReducer, useEffect } from "react";
import Rule from "./rule";
import { Table, Divider, Popconfirm, Modal, Button } from "antd";
import { formatMessage } from "umi/locale";
import { useGatewayRouter } from "./context";

const rulesReducer = (state, action) => {
  switch (action.type) {
    case "add":
      return {
        ...state,
        modelVisible: true,
        editValue: {},
        mode: -1,
      };
    case "cancelEdit":
      return {
        ...state,
        modelVisible: false,
        editValue: {},
        mode: -1,
      };
    case "editValueChange":
      return {
        ...state,
        editValue: action.payload,
      };
    case "saveEdit":
      if (state.mode == -1) {
        state.ruleList.push(state.editValue);
      } else {
        state.ruleList[state.mode] = state.editValue;
      }
      return {
        ...state,
        editValue: {},
        mode: -1,
        modelVisible: false,
      };
    case "edit":
      return {
        ...state,
        editValue: action.payload,
        modelVisible: true,
        mode: action.mode,
      };
    case "delete":
      state.ruleList.splice(action.mode, 1);
      return {
        ...state,
        mode: -1,
      };
  }
  return state;
};

export default (props) => {
  //  [
  //   {
  //     method: ["GET", "POST"],
  //     pattern: ["/_bulk"],
  //     flow: ["logging_flow"],
  //     description: "hello",
  //   },
  // ]
  const [rulesState, dispatch] = useReducer(rulesReducer, {
    ruleList: props.value || [],
    modelVisible: false,
    editValue: {},
    mode: -1,
  });
  useEffect(() => {
    if (typeof props.onChange == "function") {
      props.onChange(rulesState.ruleList);
    }
  }, [rulesState.ruleList]);
  const { flows } = useGatewayRouter();
  const columns = [
    {
      title: "Method",
      dataIndex: "method",
      render: (val) => {
        return (val || []).join(",");
      },
    },
    {
      title: "Path Pattern",
      dataIndex: "pattern",
      render: (val) => {
        return (val || []).join(",");
      },
    },
    {
      title: "Flow",
      dataIndex: "flow",
      render: (val) => {
        return (val || [])
          .map((flowID) => {
            return flows.find((f) => f.id == flowID)?.name || flowID;
          })
          .join(",");
      },
    },
    {
      title: "Description",
      dataIndex: "description",
    },
    {
      title: formatMessage({ id: "table.field.actions" }),
      render: (text, record, index) => (
        <div>
          <a
            onClick={() => {
              dispatch({
                type: "edit",
                payload: record,
                mode: index,
              });
            }}
          >
            {" "}
            {formatMessage({ id: "form.button.edit" })}
          </a>
          <Divider type="vertical" />
          <Popconfirm
            title="Sure to delete?"
            onConfirm={() => {
              dispatch({
                type: "delete",
                mode: index,
              });
            }}
          >
            <a>{formatMessage({ id: "form.button.delete" })}</a>
          </Popconfirm>
        </div>
      ),
    },
  ];
  const onEditValueChange = (val) => {
    dispatch({
      type: "editValueChange",
      payload: val,
    });
  };
  const onEditCancel = () => {
    dispatch({
      type: "cancelEdit",
    });
  };

  const onEditOk = () => {
    dispatch({ type: "saveEdit" });
  };
  const onAddClick = () => {
    dispatch({
      type: "add",
    });
  };
  return (
    <div>
      <div style={{ textAlign: "right" }}>
        <Button icon="plus" type="primary" onClick={onAddClick}>
          Add
        </Button>
      </div>
      <Table
        size={"small"}
        bordered
        dataSource={rulesState.ruleList}
        pagination={false}
        columns={columns}
      />
      <Modal
        title="Rule"
        visible={rulesState.modelVisible}
        okText="Save"
        cancelText="Cancel"
        onOk={onEditOk}
        onCancel={onEditCancel}
      >
        <Rule value={rulesState.editValue} onChange={onEditValueChange} />
      </Modal>
    </div>
  );
};
