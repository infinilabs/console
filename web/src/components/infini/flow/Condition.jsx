import { EditFlowWithProvider } from "./EditFlow";
import {
  Handle,
  useStoreState,
  removeElements,
  useUpdateNodeInternals,
} from "react-flow-renderer";
import { Icon, Dropdown, Popconfirm } from "antd";
import { useEditFlow } from "./EditSearchFlowContext";
import { useCallback, useEffect, useState, useRef } from "react";
import {
  getFiltersMenu,
  getNodeId,
  getNextHandlePostion,
  getConditionObject,
  settings,
  isOutputNode,
  setNodeHidden,
  deleteGroupNode,
} from "./nodes/filters";

const ConditionNode = ({ orientation, data, id, xPos, yPos, ...rest }) => {
  const { setElements, rfInstance, setEditState, repaint } = useEditFlow();
  const onDeleteClick = useCallback(() => {
    setElements((els) => {
      els = deleteGroupNode(id, els);

      // .map((el) => {
      //   if (el.id == data.realParentID) {
      //     if (el.data?.trueNodeID == id) {
      //       el.data = {
      //         ...el.data,
      //         trueNodeID: null,
      //         trueNextID: null,
      //       };
      //     }
      //     if (el.data?.falseNodeID == id) {
      //       el.data = {
      //         ...el.data,
      //         falseNodeID: null,
      //         falseNextID: null,
      //       };
      //     }
      //   }
      //   return el;
      // });
      return repaint(null, els);
    });
  }, [setElements]);
  const nextPos = {
    x: xPos + 10,
    y: yPos + 40,
  };

  const nodes = useStoreState((store) => store.nodes);
  const onMinusClick = useCallback(() => {
    setElements((els) => {
      let newEls = setNodeHidden(id, els);
      return repaint(null, newEls);
    });
  }, [setElements]);
  const updateNodeInternals = useUpdateNodeInternals();
  useEffect(() => {
    updateNodeInternals(id);
  }, [data]);

  return (
    <div className="flow-node sub-flow">
      <div className="wrapper">
        <div className="header">
          <div className="icon-group">
            <Popconfirm
              title="Are you sure delete this node?"
              onConfirm={onDeleteClick}
              okText="Yes"
              cancelText="No"
            >
              <div className="icon">
                <Icon type="delete" />
              </div>
            </Popconfirm>
            {/* <div className="icon" onClick={onMinusClick}>
              <Icon type="eye-invisible" />
            </div> */}
          </div>
        </div>
        <div
          className="content"
          style={{
            width: data?.width || nextPos.x,
            height: data?.height || 120,
          }}
        ></div>
      </div>
      <Handle type="target" position="top" id={`${id}-target-t`} />
      <Handle type="source" position="top" id={`${id}-source-t`} />
      <Handle
        type="target"
        position="bottom"
        id={`${id}-target-b`}
        // style={{ left: "95%" }}
      />
      <Handle
        type="source"
        position="bottom"
        id={`${id}-source-b`}
        // style={{ left: "95%" }}
      />
    </div>
  );
};

export default ConditionNode;
