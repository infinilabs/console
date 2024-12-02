import { Handle, useStoreState, removeElements } from "react-flow-renderer";
import { Icon, Popover, Dropdown } from "antd";
import "./nodes.scss";
import { useRef, useCallback, useMemo, useState, useEffect } from "react";
import {
  getFiltersMenu,
  getNodeId,
  getNextHandlePostion,
  getConditionObject,
  settings,
  isOutputNode,
} from "./filters";
import { useEditFlow } from "../EditSearchFlowContext";
import _ from "lodash";
import BaseNode from "./BaseNode";

const InputNode = (props = {}) => {
  const { data, id, xPos, yPos, type, ...rest } = props;
  const { setElements } = useEditFlow();

  const onAdd = useCallback(
    (ev) => {
      const { key } = ev;
      const newNodeID = getNodeId();
      const nextPos = {
        x: xPos + settings.nodeOffsetX / 2,
        y: yPos,
      };

      const newNode = {
        id: newNodeID,
        data: { label: key, filter: key },
        position: nextPos,
        type: key,
        draggable: false,
      };
      setElements((els) =>
        els.concat(newNode, {
          id: `e-${id}-${newNodeID}`,
          source: id,
          target: newNodeID,
          arrowHeadType: "arrow",
        })
      );
    },
    [setElements, xPos, yPos]
  );
  return (
    <BaseNode
      onAdd={onAdd}
      {...props}
      editable={false}
      deletable={false}
      iconType="play-circle"
    />
  );
};

export default InputNode;
