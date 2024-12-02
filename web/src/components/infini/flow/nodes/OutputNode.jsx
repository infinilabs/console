import { Handle, useStoreState, removeElements } from "react-flow-renderer";
import { Icon, Popover, Dropdown } from "antd";
import "./nodes.scss";
import { useRef, useCallback, useMemo, useState } from "react";
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

const OutputNode = (props = {}) => {
  return (
    <BaseNode
      {...props}
      editable={false}
      deletable={false}
      addable={false}
      iconType="stop"
    />
  );
};

_.extend(OutputNode, {
  nodeType: "stop",
});

export default OutputNode;
