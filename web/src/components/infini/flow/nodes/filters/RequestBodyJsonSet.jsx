import { Handle, useStoreState, removeElements } from "react-flow-renderer";
import { Icon, Popover, Dropdown } from "antd";
import "../nodes.scss";
import { useRef, useCallback, useMemo, useState } from "react";
import RequestBodyJsonSetForm from "./components/RequestBodyJsonSet";
import {
  getFiltersMenu,
  getNodeId,
  getNextHandlePostion,
  getConditionObject,
  parseConditionObject,
  settings,
  isOutputNode,
} from ".";
import { useEditFlow } from "../../EditSearchFlowContext";
import _ from "lodash";
import BaseNode from "../BaseNode";

const RequestBodyJsonSetNode = (props = {}) => {
  const { data, id, xPos, yPos, type, ...rest } = props;
  const { setElements } = useEditFlow();
  return <BaseNode {...props} EditComponent={RequestBodyJsonSetForm} />;
};

_.extend(RequestBodyJsonSetNode, {
  toObject: (data = {}) => {
    const { properties = {} } = data;
    const filter = RequestBodyJsonSetNode.nodeType;

    const pathArr = (properties.path || []).map(
      (p) => `${p.field} -> ${p.value}`
    );
    let result = {
      [filter]: {
        path: pathArr,
      },
    };
    if (properties.when) {
      result[filter].when = getConditionObject(properties.when);
    }
    return result;
  },
  parseObject: (data) => {
    data = data || {};
    let result = {
      path: (data.path || [])
        .filter((p) => {
          if (typeof p !== "string") {
            console.warn("expect string path, got ", p);
            return false;
          }
          return true;
        })
        .map((p) => {
          const parts = (p || "").split(" -> ");
          return {
            field: parts[0],
            value: parts[1],
          };
        }),
    };
    if (data.when) {
      result["when"] = parseConditionObject(data.when);
    }
    return result;
  },
  nodeType: "request_body_json_set",
});

export default RequestBodyJsonSetNode;
