import { Handle, useStoreState } from "react-flow-renderer";
import { Icon, Popover, Select } from "antd";
import "./nodes.scss";
import { useRef, useCallback, useMemo, useState } from "react";
import ConditionEditor from "./components/ConditionEditor";
import { useEditFlow } from "../EditSearchFlowContext";

const Condition = ({ data, id }) => {
  const state = useStoreState((state) => state);
  const sourceEdges = state.edges.filter((edge) => edge.source == id);
  const [editWinVisible, setEditWinVisible] = useState(false);
  const { setElements } = useEditFlow();
  const onConditionSave = (value) => {
    setElements((els) =>
      els.map((el) => {
        if (el.id == id) {
          el.data = {
            ...el.data,
            condition_value: value,
          };
        }
        return el;
      })
    );
    setEditWinVisible(false);
  };

  const content = useMemo(() => {
    return <ConditionEditor onSave={onConditionSave} />;
  }, [setEditWinVisible]);
  const isValidConnection = useCallback(
    (params) => {
      return sourceEdges.length < 2;
    },
    [sourceEdges.length]
  );
  let targetNodes = [];

  if (sourceEdges.length == 2) {
    targetNodes = state.nodes.filter((node) => {
      return sourceEdges.some((edge) => edge.target == node.id);
    });
  }
  const [conditionState, setConditionState] = useState({
    ifValue: targetNodes[0]?.id,
    elseValue: targetNodes[1],
  });
  const onIfSelectedChange = (value) => {
    const elseFlow = targetNodes.find((node) => node.id != value);
    setConditionState({
      ifValue: value,
      elseValue: elseFlow,
    });
    setElements((els) => {
      return els.map((el) => {
        if (el.id == id) {
          el.data = {
            ...el.data,
            if_flow: value,
            else_flow: elseFlow.id,
          };
        }
        return el;
      });
    });
  };

  return (
    <div className="flow-node">
      <div className="wrapper">
        <div className="header">
          <div className="title">
            <Icon type="control" className="node-icon" />
            <span className="label">{data.label}</span>
          </div>
          <div className="icon">
            <Popover
              content={content}
              visible={editWinVisible}
              onVisibleChange={setEditWinVisible}
              trigger="click"
            >
              <Icon type="edit" />
            </Popover>
          </div>
        </div>
        {sourceEdges.length == 2 ? (
          <div className="content">
            <div className="row">
              <div className="label">If Flow</div>
              <div className="value">
                <Select
                  style={{ width: "100%" }}
                  value={conditionState.ifValue}
                  onChange={onIfSelectedChange}
                >
                  {targetNodes.map((node) => (
                    <Select.Option key={node.id} value={node.id}>
                      {node.data?.label}
                    </Select.Option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="row">
              <div className="label">Else Flow</div>
              <div className="value">
                {conditionState.elseValue?.data.label}
              </div>
            </div>
          </div>
        ) : null}
      </div>
      <Handle type="target" position="left" />
      <Handle
        type="source"
        position="right"
        id="r"
        isValidConnection={isValidConnection}
      />
    </div>
  );
};

export default Condition;
