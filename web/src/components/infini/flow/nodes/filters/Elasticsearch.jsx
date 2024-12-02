import { Handle, useStoreState } from "react-flow-renderer";
import { Icon, Popover, Dropdown } from "antd";
import "../nodes.scss";
import { useRef, useCallback, useMemo, useState } from "react";
import ElasticsearchEditor from "./components/Elasticsearch";
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
import BaseNode from "../BaseNode";

const ElasticsearchNode = (props = {}) => {
  return <BaseNode {...props} EditComponent={ElasticsearchEditor} />;
};

_.extend(ElasticsearchNode, {
  toObject: (data = {}) => {
    const { filter, properties = {} } = data;
    let result = {
      [filter]: {
        elasticsearch: properties.elasticsearch,
      },
    };
    if (properties.when) {
      result.when = getConditionObject(properties.when);
    }
    return result;
  },
  nodeType: "elasticsearch",
  parseObject: (data = {}) => {
    let result = {
      path: data.elasticsearch || "",
    };
    if (data.when) {
      result["when"] = parseConditionObject(data.when);
    }
    return result;
  },
});

export default ElasticsearchNode;
