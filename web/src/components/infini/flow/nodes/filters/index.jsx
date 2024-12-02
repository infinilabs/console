/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

import RequestBodyJsonDelNode from "./RequestBodyJsonDel";
import IfElseNode from "./IfElse";
import RequestBodyJsonSetNode from "./RequestBodyJsonSet";
import ElasticsearchNode from "./Elasticsearch";
import InputNode from "../InputNode";
import OutputNode from "../OutputNode";
import BaseNode from "../BaseNode";
import ConditionNode from "../../Condition";

import { Menu } from "antd";
import ObjectEditor from "../components/editors/ObjectEditor";
import { getDefaultValue } from "../components/helper";

export const settings = {
  nodeOffsetX: 300,
  nodeOffsetY: 150,
};
const filtersMap = {
  start: InputNode,
  stop: OutputNode,
  condition: ConditionNode,
  [IfElseNode.nodeType]: IfElseNode,
  // [RequestBodyJsonDelNode.nodeType]: RequestBodyJsonDelNode,
  // [RequestBodyJsonSetNode.nodeType]: RequestBodyJsonSetNode,
  // [ElasticsearchNode.nodeType]: ElasticsearchNode,
};
export const registFilters = (newFilters) => {
  Object.keys(newFilters).forEach((k) => {
    filtersMap[k] = newFilters[k];
  });
  return filtersMap;
};

export const getFiltersMap = () => {
  return filtersMap;
};

export const getFilterKeys = (nodeTypes = {}) => {
  return Object.keys(nodeTypes).filter(
    (key) => key != "start" && key != "stop" && key != "condition"
  );
};

export const getNodeId = () => `filter_node_${+new Date()}`;

export default {
  RequestBodyJsonDelNode,
};

export const getConditionObject = (whenObj = {}) => {
  const { condition_type, conditions, field, value } = whenObj;
  if (!condition_type) {
    return {};
  }
  if (!conditions || conditions.length == 0) {
    //[bool oper] => array value
    if (field === "") {
      return {
        [condition_type]: value,
      };
    }
    if (condition_type == "range") {
      let rangeVal = {};
      (value || []).forEach((v) => {
        if (typeof v.value == "string") {
          let nv = parseFloat(v.value);
          if (!isNaN(nv)) {
            rangeVal[v.field] = nv;
            return;
          }
        }
        if (v.field) rangeVal[v.field] = v.value;
      });
      return {
        [condition_type]: {
          [field]: rangeVal,
        },
      };
    }
    return {
      [condition_type]: {
        [field]: value,
      },
    };
  }
  return {
    [condition_type]: conditions.map((cond) => getConditionObject(cond)),
  };
};

export const parseConditionObject = (whenObj = {}) => {
  let [condition_type] = Object.keys(whenObj);
  let [conditionValue] = Object.values(whenObj);

  if (!condition_type) {
    return {};
  }
  if (Array.isArray(conditionValue)) {
    if (!["or", "and", "not"].includes(condition_type)) {
      return {
        condition_type,
        field: "",
        value: conditionValue,
      };
    }
    return {
      condition_type,
      conditions: conditionValue.map((cond) => parseConditionObject(cond)),
    };
  }

  //range
  if (condition_type == "range") {
    const vkeys = Object.keys(conditionValue);
    let field = "";
    let value = [{}, {}];
    if (vkeys.length > 1) {
      //{range:{"_ctx.request.body_length.gte": 100,"_ctx.request.body_length.lt": 5000}}
      value = [];
      vkeys.forEach((k) => {
        const idx = k.lastIndexOf(".");
        if (idx > 1) {
          field = k.slice(0, idx);
          value.push({
            field: k.slice(idx + 1),
            value: conditionValue[k],
          });
        }
      });
    } else if (vkeys.length == 1) {
      //{range: {_ctx.response.code: {gte: 400}}}
      field = vkeys[0];
      value = Object.keys(conditionValue[field]).map((k) => {
        return {
          field: k,
          value: conditionValue[field][k],
        };
      });
    }
    return {
      condition_type,
      field,
      value,
    };
  }

  let [field] = Object.keys(conditionValue || {});
  let [value] = Object.values(conditionValue || {});
  return {
    condition_type,
    field,
    value,
  };
};

export const isOutputNode = (nodeType) => {
  return [OutputNode.nodeType].includes(nodeType);
};

export const deleteGroupNode = (nodeID, els = []) => {
  const targetNode = els.find((el) => el.id == nodeID);
  if (!targetNode) {
    return els;
  }
  const relParentNode = els.find((el) => el.id == targetNode.data.realParentID);
  if (relParentNode) {
    if (relParentNode.data.trueNodeID == nodeID) {
      //delete left sub node of type if_else
      let nextNode = els.find((el) => el.id == relParentNode.data.trueNextID);
      while (nextNode) {
        if (nextNode.type == IfElseNode.nodeType) {
          if (nextNode.data.trueNodeID) {
            els = deleteGroupNode(nextNode.data.trueNodeID, els);
          }
          if (nextNode.data.falseNodeID) {
            els = deleteGroupNode(nextNode.data.falseNodeID, els);
          }
        }
        nextNode = els.find((el) => el.id == nextNode.data.nextNodeID);
      }
    }

    if (relParentNode.data.falseNodeID == nodeID) {
      //delete right sub node of type if_else
      let nextNode = els.find((el) => el.id == relParentNode.data.falseNextID);
      while (nextNode) {
        if (nextNode.type == IfElseNode.nodeType) {
          if (nextNode.data.trueNodeID) {
            els = deleteGroupNode(nextNode.data.trueNodeID, els);
          }
          if (nextNode.data.falseNodeID) {
            els = deleteGroupNode(nextNode.data.falseNodeID, els);
          }
        }
        nextNode = els.find((el) => el.id == nextNode.data.nextNodeID);
      }
    }
  }
  return els.filter((el) => {
    if (el.id == nodeID) {
      return false;
    }
    if (el.data?.parentID && el.data.parentID == nodeID) {
      return false;
    }
    return true;
  });
};

export const deleteNode = (nodeID, els) => {
  const targetNode = els.find((el) => el.id == nodeID);
  if (!targetNode) {
    return els;
  }
  const data = targetNode.data;
  if (targetNode.type == IfElseNode.nodeType) {
    if (targetNode.data.trueNodeID) {
      els = deleteGroupNode(targetNode.data.trueNodeID, els);
    }
    if (targetNode.data.falseNodeID) {
      els = deleteGroupNode(targetNode.data.falseNodeID, els);
    }
  }
  let preEdge = els.find(
    (el) => el.target == nodeID && el.data?.parentID == data.parentID
  );
  //group first node
  if (!preEdge) {
    preEdge = els.find(
      (el) => el.source == data.parentID && el.target == nodeID
    );
  }
  let nextEdge = els.find(
    (el) => el.target == data.nextNodeID && el.source == nodeID
  );
  //group last node
  if (!nextEdge) {
    nextEdge = els.find(
      (el) => el.target == data.parentID && el.source == nodeID
    );
  }
  let realParentNode = null;
  let parentNode = null;
  if (targetNode.data.realParentID) {
    realParentNode = els.find((el) => el.id == targetNode.data.realParentID);
    parentNode = els.find((el) => el.id == targetNode.data.parentID);
  }
  const preNode = els.find((el) => el.id == preEdge.source);

  //delete gorup node when target node is the only sub node
  if (
    data.parentID &&
    preEdge &&
    nextEdge &&
    preEdge.source == data.parentID &&
    nextEdge.target == data.parentID
  ) {
    return deleteGroupNode(data.parentID, els);
  }
  els = els
    .filter((el) => {
      //delete target node
      if (el.id == nodeID) {
        return false;
      }
      //delete next edge
      if (nextEdge && el.id == nextEdge.id) {
        return false;
      }
      return true;
    })
    .map((el) => {
      //update pre edge target
      if (preEdge && el.id == preEdge.id && nextEdge) {
        el.target = nextEdge.target;
        //update target handle of pre edge when delete target node is group last node
        if (nextEdge.target == data.parentID) {
          el.targetHandle = nextEdge.targetHandle;
        }
      }
      //update pre node nextNodeID
      if (preNode && preNode.id == el.id && nextEdge) {
        el.data = {
          ...el.data,
          nextNodeID: data.nextNodeID,
        };
      }
      //update sub condition(group) edge target when delete root node
      if (el.target == nodeID && nextEdge) {
        el.target = nextEdge.target;
      }
      if (
        realParentNode &&
        parentNode &&
        el.id == realParentNode.id &&
        preEdge &&
        preEdge.source == data.parentID
      ) {
        //update next node id of real parent when delete target node is group first node
        if (realParentNode.data.trueNodeID == data.parentID) {
          //left node
          el.data = {
            ...el.data,
            trueNextID: nextEdge.target,
          };
        }
        if (realParentNode.data.falseNodeID == data.parentID) {
          //right node
          el.data = {
            ...el.data,
            falseNextID: nextEdge.target,
          };
        }
      }
      return el;
    });
  return els;
};

export const updateLastEdgeTarget = (nodeID, els = [], targetID) => {
  const targetNode = els.find((el) => el.id == nodeID);
  const data = targetNode.data;
  if (data.trueNodeID || data.falseNodeID) {
    //find sub if_else node
    const ifElseNodes = els.filter((el) => {
      if (
        el.type == "if_else" &&
        el.data.parentID &&
        (el.data.parentID == data.trueNodeID ||
          el.data.parentID == data.falseNodeID)
      ) {
        return true;
      }
      return false;
    });
    //find true sub last node
    if (data.trueNodeID) {
      const startNode = els.find((el) => el.id == data.trueNextID);
      let nextEl = startNode;
      let lastEl = null;
      while (nextEl && nextEl.data.parentID == startNode.data.parentID) {
        lastEl = nextEl;
        nextEl = els.find((el) => el.id == nextEl.data.nextNodeID);
      }
      //update edge
      if (lastEl) {
        els = els.map((el) => {
          if (el.source == lastEl.id) {
            el.target = targetID;
          }
          return el;
        });
      }
    }
    //find false sub last node
    if (data.falseNodeID) {
      const startNode = els.find((el) => el.id == data.falseNextID);
      let nextEl = startNode;
      let lastEl = null;
      while (nextEl && nextEl.data.parentID == startNode.data.parentID) {
        lastEl = nextEl;
        nextEl = els.find((el) => el.id == nextEl.data.nextNodeID);
      }
      //update edge
      if (lastEl) {
        els = els.map((el) => {
          if (el.source == lastEl.id) {
            el.target = targetID;
          }
          return el;
        });
      }
    }

    ifElseNodes.forEach((sn) => {
      els = updateLastEdgeTarget(sn.id, els, targetID);
    });
  }
  return els;
};

//collect node value data
export const collectNodeValue = (nodeID, nodes = [], nodeTypes = {}) => {
  const targetNode = nodes.find((el) => el.id == nodeID);
  const data = targetNode.data;
  if (targetNode.type == IfElseNode.nodeType) {
    const { properties } = data;
    const filter = {
      if: getConditionObject(properties?.if || {}),
    };
    if (targetNode.data.trueNodeID) {
      const startNode = nodes.find(
        (node) => targetNode.data.trueNextID == node.id
      );
      let nextNode = startNode;
      let thenFilters = [];
      while (nextNode) {
        thenFilters.push(collectNodeValue(nextNode.id, nodes, nodeTypes));
        nextNode = nodes.find(
          (node) =>
            node.id == nextNode.data.nextNodeID &&
            node.data.parentID == startNode.data.parentID
        );
      }
      filter["then"] = thenFilters;
    }
    if (targetNode.data.falseNodeID) {
      const startNode = nodes.find(
        (node) => targetNode.data.falseNextID == node.id
      );
      let nextNode = startNode;
      let elseFilters = [];
      while (nextNode) {
        elseFilters.push(collectNodeValue(nextNode.id, nodes, nodeTypes));
        nextNode = nodes.find(
          (node) =>
            node.id == nextNode.data.nextNodeID &&
            node.data.parentID == startNode.data.parentID
        );
      }
      filter["else"] = elseFilters;
    }
    return filter;
  } else {
    if (nodeTypes[targetNode.type]) {
      return nodeTypes[targetNode.type].toObject(targetNode.data);
    }
    return {};
  }
};
let nodeCount = 1;
export const parseElements = (
  nodeValues = [],
  parentID,
  realParentID,
  isLeft = true,
  nextNodeID,
  nodeTypes
) => {
  if (!(nodeValues instanceof Array)) {
    console.warn("invalid node values: ", nodeValues);
    return [];
  }
  let elements = [];
  let isLast = true;
  let lastIndertNodeID = "";
  let leftNodeID = "";
  let rightNodeID = "";
  nodeValues.reverse().forEach((nv, i) => {
    if (!nv) {
      return;
    }
    if (!nv.if && !nodeTypes[Object.keys(nv)[0]]) {
      console.warn("got unkonw filter object:", nv, "auto skiped!");
      return;
    }
    const nodeID = getNodeId() + nodeCount++;
    const isFirstNode = i == nodeValues.length - 1 && parentID == null;
    const innerNextNodeID = isLast ? nextNodeID : lastIndertNodeID;
    if (nodeValues.length - 1 == i && parentID) {
      //group node to first sub node edge
      elements.push({
        id: `ex-${parentID}-${nodeID}`,
        source: parentID,
        target: nodeID,
        arrowHeadType: "arrow",
        type: "smoothstep",
        data: {
          parentID: parentID,
          realParentID: realParentID,
        },
        sourceHandle: `${parentID}-source-t`,
      });
    }
    if (isLast && parentID) {
      //last sub node to parent node edge
      elements.push({
        id: `ex-${nodeID}-${parentID}`,
        source: nodeID,
        target: parentID,
        type: "smoothstep",
        data: {
          parentID: parentID,
          realParentID: realParentID,
        },
        targetHandle: `${parentID}-target-b`,
        // style: { strokeWidth: 2 },
        arrowHeadType: "arrow",
      });
    }
    if (isLast && !parentID) {
      // console.log(lastIndertNodeID);
      //last root node to output node edge
      const lastEdge = {
        id: `e-${nodeID}-2`,
        source: nodeID,
        target: "2",
        arrowHeadType: "arrow",
        type: "smoothstep",
        data: {
          parentID: parentID,
          realParentID: realParentID,
        },
        isHidden: true,
      };
      // if (nv.type == IfElseNode.nodeType) {
      //   lastEdge.sourceHandle = "r";
      // }
      elements.push(lastEdge);
    }
    if (!isLast) {
      elements.push({
        id: `e-${nodeID}-${innerNextNodeID}`,
        source: nodeID,
        target: innerNextNodeID,
        arrowHeadType: "arrow",
        type: "smoothstep",
        // animated: isLast && parentID,
        data: {
          parentID: parentID,
          realParentID: realParentID,
        },
      });
    }

    if (nv.if) {
      const { if: ifCondition, then: thenNode, else: elseNode } = nv;
      // elements.push({
      //   id: `e-${nodeID}-${innerNextNodeID}`,
      //   source: nodeID,
      //   target: innerNextNodeID,
      //   arrowHeadType: "arrow",
      //   type: "smoothstep",
      //   data: {
      //     parentID: parentID,
      //     realParentID: realParentID,
      //   },
      //   // animated: isLast && parentID,
      // });
      const data = {
        label: "if_else",
        filter: "if_else",
        isFirstNode,
        nextNodeID: innerNextNodeID,
        parentID: parentID,
        realParentID: realParentID,
        properties: {
          if: parseConditionObject(ifCondition),
        },
      };
      //add ture condtion node
      if (nv.then && nv.then.length > 0) {
        leftNodeID = nodeID + "_condition_true";
        data.trueNodeID = leftNodeID;
        elements.push({
          id: leftNodeID,
          data: {
            realParentID: nodeID,
            width: 300,
          },
          position: {
            x: 0,
            y: 150,
          },
          type: "condition",
        });
        //ifelse node to group node edge
        elements.push({
          id: `ex-${nodeID}-${leftNodeID}`,
          source: nodeID,
          target: leftNodeID,
          arrowHeadType: "arrow",
          type: "smoothstep",
          sourceHandle: "b1",
          targetHandle: `${leftNodeID}-target-t`,
          data: {
            parentID: leftNodeID,
            realParentID: nodeID,
          },
          label: "True",
          style: { stroke: "green" },
        });
        //group node to next node edge
        if (!parentID) {
          elements.push({
            id: `ex-${leftNodeID}-${innerNextNodeID}`,
            source: leftNodeID,
            target: innerNextNodeID,
            arrowHeadType: "arrow",
            type: "smart",
            data: {
              parentID: leftNodeID,
              realParentID: nodeID,
            },
            sourceHandle: `${leftNodeID}-source-b`,
          });
        } else {
          elements.push({
            id: `ex-${leftNodeID}-${parentID}`,
            source: leftNodeID,
            target: parentID,
            arrowHeadType: "arrow",
            type: "smoothstep",
            data: {
              parentID: leftNodeID,
              realParentID: nodeID,
            },
            sourceHandle: `${leftNodeID}-source-b`,
            targetHandle: `${parentID}-target-b`,
          });
        }
        const subEls = parseElements(
          nv.then,
          leftNodeID,
          nodeID,
          true,
          innerNextNodeID,
          nodeTypes
        );
        data.trueNextID = subEls.parentNextNodeID;
        elements = elements.concat(subEls);
      }
      if (nv.else && nv.else.length > 0) {
        rightNodeID = nodeID + "_condition_false";
        data.falseNodeID = rightNodeID;
        elements.push({
          id: rightNodeID,
          data: {
            realParentID: nodeID,
            width: 300,
          },
          type: "condition",
          position: {
            x: 0,
            y: 50,
          },
        });
        //ifelse node to group node edge
        elements.push({
          id: `ex-${nodeID}-${rightNodeID}`,
          source: nodeID,
          target: rightNodeID,
          arrowHeadType: "arrow",
          type: "smoothstep",
          sourceHandle: "b2",
          targetHandle: `${rightNodeID}-target-t`,
          data: {
            parentID: rightNodeID,
            realParentID: nodeID,
          },
          label: "False",
          style: { stroke: "red" },
        });
        //group node to next node edge
        if (!parentID) {
          elements.push({
            id: `ex-${rightNodeID}-${innerNextNodeID}`,
            source: rightNodeID,
            target: innerNextNodeID,
            arrowHeadType: "arrow",
            // type: "smoothstep",
            type: "smart",
            data: {
              parentID: rightNodeID,
              realParentID: nodeID,
            },
            sourceHandle: `${rightNodeID}-source-b`,
          });
        } else {
          // group node to parent group node
          elements.push({
            id: `ex-${rightNodeID}-${parentID}`,
            source: rightNodeID,
            target: parentID,
            arrowHeadType: "arrow",
            type: "smoothstep",
            data: {
              parentID: rightNodeID,
              realParentID: nodeID,
            },
            sourceHandle: `${rightNodeID}-source-b`,
            targetHandle: `${parentID}-target-b`,
          });
        }
        const subEls = parseElements(
          nv.else,
          rightNodeID,
          nodeID,
          false,
          innerNextNodeID,
          nodeTypes
        );
        data.falseNextID = subEls.parentNextNodeID;

        elements = elements.concat(subEls);
      }
      elements.push({
        id: nodeID,
        position: {
          x: 0,
          y: 50,
        },
        data: data,
        type: IfElseNode.nodeType,
      });
      isLast = false;
      lastIndertNodeID = nodeID;
      return;
    }
    const [nodeType] = Object.keys(nv);
    const [nodeValue] = Object.values(nv);
    elements.push({
      id: nodeID,
      data: {
        label: nodeType,
        filter: nodeType,
        isFirstNode: isFirstNode,
        nextNodeID: innerNextNodeID,
        parentID: parentID,
        realParentID: realParentID,
        properties: nodeTypes[nodeType]
          ? nodeTypes[nodeType].parseObject(nodeValue)
          : {},
      },
      position: {
        x: 0,
        y: 50,
      },
      type: nodeType,
    });
    isLast = false;
    lastIndertNodeID = nodeID;
  });
  if (realParentID) {
    elements.parentNextNodeID = lastIndertNodeID;
  }
  return elements;
};
const nodeGap = 24;
const groupPadding = { x: 20, y: 40 };
const nodesDefault = {
  start: {
    width: 120,
  },
  if_else: {
    height: 94,
  },
};
export const repaint = (nodeID, els = [], rfInstance) => {
  if (rfInstance) {
    rfInstance.setTransform({ x: 0, y: 0, zoom: 1 });
  }
  const { els: newEls } = _repaint(nodeID, els, false, null);
  return newEls;
};

const _repaint = (nodeID, els = [], isRecursion, startPos) => {
  let targetNode = null;
  if (isRecursion) {
    targetNode = els.find((el) => el.id == nodeID);
  } else {
    if (!nodeID) {
      targetNode = els.find((el) => el.type == "start");
    } else {
      //find root node of input nodeID
      targetNode = els.find((el) => el.id == nodeID);
      while (targetNode && targetNode.realParentID) {
        targetNode = els.find((el) => el.id == targetNode.realParentID);
      }
    }
  }

  if (!targetNode) {
    return els;
  }
  //judge whether target node is first sub node or not
  let isFirstSubNode = false;
  if (targetNode.type == "start") {
    isFirstSubNode = true;
  } else {
    if (targetNode.data.realParentID) {
      const realParentNode = els.find(
        (el) => el.id == targetNode.data.realParentID
      );
      if (!realParentNode) {
        console.log("can not found real parent id");
      }
      isFirstSubNode =
        realParentNode.data.trueNextID == targetNode.id ||
        realParentNode.data.falseNextID == targetNode.id;
    }
  }

  if (!isRecursion) {
    startPos = {
      x: groupPadding.x,
      y: 50, //groupPadding.y,
    };
  }
  let maxSubWidth = 290 + groupPadding.x;
  let isPaintLeft = false;
  let isPaintRight = false;
  let subMaxNextPos = {
    ...startPos,
  };
  let leftMaxWidth = 0;
  if (targetNode.data.trueNodeID && targetNode.data.trueNextID) {
    const trueNode = els.find((el) => el.id == targetNode.data.trueNodeID);
    if (trueNode && trueNode.isHidden != true) {
      //hidden main edge
      els = els.map((el) => {
        if (
          el.source == targetNode.id &&
          (el.target == targetNode.data.nextNodeID ||
            el.target == targetNode.data.parentID)
        ) {
          el.isHidden = true;
        }
        return el;
      });
      isPaintLeft = true;
      const { els: newEls, maxSubWidth: newMaxSubWidth, maxPos } = _repaint(
        targetNode.data.trueNextID,
        els,
        true,
        {
          x: startPos.x + groupPadding.x,
          y: startPos.y + settings.nodeOffsetY + groupPadding.y,
        }
      );
      els = newEls;
      //update targetNode after sub node painted
      subMaxNextPos = {
        y: maxPos.y,
        x: startPos.x + groupPadding.x,
      };
      const maxSubWidthWidthPadding = newMaxSubWidth + groupPadding.x * 2;
      if (maxSubWidthWidthPadding > maxSubWidth) {
        maxSubWidth = maxSubWidthWidthPadding;
      }
      leftMaxWidth = maxSubWidth;
      // console.log(els.maxPos.x, targetNode.type, targetNode.data.trueNodeID);
      //repaint group node
      els = els.map((el) => {
        if (el.id == targetNode.data.trueNodeID) {
          el.position = {
            x: startPos.x,
            y: startPos.y + settings.nodeOffsetY,
          };
          el.data = {
            ...el.data,
            width: maxSubWidth,
            height: subMaxNextPos.y - startPos.y - settings.nodeOffsetY - 30,
          };
        }
        return el;
      });
    }
  }
  if (targetNode.data.falseNodeID && targetNode.data.falseNextID) {
    const falseNode = els.find((el) => el.id == targetNode.data.falseNodeID);
    if (falseNode && falseNode.isHidden != true) {
      if (!isPaintLeft) {
        //hidden main edge
        els = els.map((el) => {
          if (
            el.source == targetNode.id &&
            (el.target == targetNode.data.nextNodeID ||
              el.target == targetNode.data.parentID)
          ) {
            el.isHidden = true;
          }
          return el;
        });
      }
      const { els: newEls, maxPos, maxSubWidth: newMaxSubWidth } = _repaint(
        targetNode.data.falseNextID,
        els,
        true,
        {
          x: startPos.x + leftMaxWidth + groupPadding.x * 3,
          y: startPos.y + settings.nodeOffsetY + groupPadding.y,
        }
      );
      els = newEls;
      //update targetNode after sub node painted
      // targetNode = els.find((el) => el.id == targetNode.id);
      subMaxNextPos = {
        y: Math.max(subMaxNextPos.y, maxPos.y),
        x: startPos.x + groupPadding.x,
      };
      const maxSubWidthWidthPadding = newMaxSubWidth + groupPadding.x * 2;

      maxSubWidth = leftMaxWidth + groupPadding.x * 2 + maxSubWidthWidthPadding;
      els = els.map((el) => {
        if (el.id == targetNode.data.falseNodeID) {
          el.position = {
            x: startPos.x + leftMaxWidth + groupPadding.x * 2,
            y: startPos.y + settings.nodeOffsetY,
          };
          // console.log(el, subMaxNextPos.x - leftMaxNextPos.x - 80);
          el.data = {
            ...el.data,
            height: maxPos.y - startPos.y - settings.nodeOffsetY - 30,
            width: maxSubWidthWidthPadding,
          };
        }
        return el;
      });
      isPaintRight = true;
    }
  }
  if (!isPaintLeft && !isPaintRight) {
    //make main edge visible
    els = els.map((el) => {
      if (
        el.source == targetNode.id &&
        (el.target == targetNode.data.nextNodeID ||
          el.target == targetNode.data.parentID)
      ) {
        el.isHidden = false;
      }
      return el;
    });
  }
  //repaint target node
  els.map((el) => {
    if (el.id == targetNode.id) {
      el.position = {
        ...startPos,
      };
      if (targetNode.type == IfElseNode.nodeType) {
        el.position = {
          y: startPos.y,
          x: startPos.x + maxSubWidth / 2 - (targetNode.data.width || 300) / 2,
        };
      }
    }
    return el;
  });
  // console.log("repaint ", targetNode.id, targetNode.type);
  let height =
    targetNode.data.height || nodesDefault[targetNode.type]?.height || 43;
  const maxPosY = Math.max(height + startPos.y, subMaxNextPos.y);

  //repaint next node;
  let nextNode = els.find(
    (el) =>
      el.id == targetNode.data.nextNodeID &&
      el.data?.parentID == targetNode.data.parentID
  );
  // const isLastSubNode = !nextNode ? true : false;

  let maxPos = {
    x: startPos.x,
    y: maxPosY + nodeGap,
  };
  if (!targetNode.data?.parentID) {
    let width =
      targetNode.data.width || nodesDefault[targetNode.type]?.width || 300;
    if (targetNode.type == IfElseNode.nodeType) {
      width = Math.max(width, maxSubWidth) + 60;
    }

    maxPos = {
      x: startPos.x + width + nodeGap,
      y: startPos.y,
    };
  }
  while (nextNode && isFirstSubNode) {
    const {
      els: newEls,
      maxPos: newMaxPos,
      maxSubWidth: newMaxSubWidth,
    } = _repaint(nextNode.id, els, true, maxPos);
    // console.log(nextNode.type, nextNode.data.parentID);
    els = newEls;
    if (newMaxPos.x > maxPos.x) {
      maxPos.x = newMaxPos.x;
    }
    if (newMaxPos.y > maxPos.y) {
      maxPos.y = newMaxPos.y;
    }
    if (newMaxSubWidth > maxSubWidth) {
      maxSubWidth = newMaxSubWidth;
    }
    nextNode = els.find(
      (el) =>
        el.id == nextNode.data.nextNodeID &&
        el.data.parentID == targetNode.data.parentID
    );
  }
  return { els, maxPos, maxSubWidth };
};

export const setNodeHidden = (nodeID, els = [], isHidden = true) => {
  const targetNode = els.find((el) => el.id == nodeID);
  if (!targetNode) {
    return els;
  }
  const relParentNode = els.find((el) => el.id == targetNode.data.realParentID);
  if (relParentNode) {
    //find left sub node of type if_else
    if (relParentNode.data.trueNodeID == nodeID) {
      let nextNode = els.find((el) => el.id == relParentNode.data.trueNextID);
      while (nextNode) {
        if (nextNode.type == IfElseNode.nodeType) {
          if (nextNode.data.trueNodeID) {
            els = setNodeHidden(nextNode.data.trueNodeID, els, isHidden);
          }
          if (nextNode.data.falseNodeID) {
            els = setNodeHidden(nextNode.data.falseNodeID, els, isHidden);
          }
        }
        nextNode = els.find((el) => el.id == nextNode.data.nextNodeID);
      }
    }
    //find right sub node of type if_else
    if (relParentNode.data.falseNodeID == nodeID) {
      let nextNode = els.find((el) => el.id == relParentNode.data.falseNextID);
      while (nextNode) {
        if (nextNode.type == IfElseNode.nodeType) {
          if (nextNode.data.trueNodeID) {
            els = setNodeHidden(nextNode.data.trueNodeID, els, isHidden);
          }
          if (nextNode.data.falseNodeID) {
            els = setNodeHidden(nextNode.data.falseNodeID, els, isHidden);
          }
        }
        nextNode = els.find((el) => el.id == nextNode.data.nextNodeID);
      }
    }
  }
  return els.map((el) => {
    if (el.id == nodeID) {
      el.isHidden = isHidden;
    }
    if (el.data?.parentID && el.data.parentID == nodeID) {
      el.isHidden = isHidden;
    }
    return el;
  });
};

export const generateFilterNode = (properties) => {
  const Editor = ({ value = {}, onChange }) => {
    return (
      <ObjectEditor value={value} onChange={onChange} properties={properties} />
    );
  };
  return (props) => {
    return <BaseNode {...props} EditComponent={Editor} />;
  };
};

export const createFilterNodes = (filters) => {
  const filtersNode = {};
  Object.keys(filters).forEach((filterKey) => {
    const filterNode = generateFilterNode(filters[filterKey]?.properties || {});
    _.extend(filterNode, {
      toObject: (data = {}) => {
        const { properties = {} } = data;
        let result = {
          [filterKey]: {
            ...(properties || {}),
          },
        };
        if (properties.when) {
          result[filterKey].when = getConditionObject(properties.when);
        }
        return result;
      },
      nodeType: filterKey,
      parseObject: (data) => {
        data = data || {};
        let result = {
          ...data,
        };
        if (data.when) {
          result["when"] = parseConditionObject(data.when);
        }
        return result;
      },
      properties: filters[filterKey]?.properties || {},
    });

    filtersNode[filterKey] = filterNode;
  });
  return filtersNode;
};

export const getDefaultNodePropertiesValue = (nodeProperties = {}) => {
  // getDefaultValue
  let nodePropertiesValue = {};
  Object.keys(nodeProperties).forEach((key) => {
    const { type, default_value } = nodeProperties[key];
    nodePropertiesValue[key] = default_value || getDefaultValue(type);
  });

  return nodePropertiesValue;
};
