import { Handle, useStoreState } from "react-flow-renderer";
import { Icon, Dropdown, Select, Button, Popconfirm } from "antd";
import "../nodes.scss";
import { useRef, useCallback, useMemo, useState, useEffect } from "react";
import ConditionEditor from "../components/ConditionEditor";
import { useEditFlow, useEditProperties } from "../../EditSearchFlowContext";
import {
  getFilterKeys,
  getNodeId,
  settings,
  isOutputNode,
  deleteNode,
  updateLastEdgeTarget,
  setNodeHidden,
  getDefaultNodePropertiesValue,
} from ".";
import IfElse from "./components/IfElse";
import DropdownSelect from "../components/DropdownSelect";

const IfElseNode = ({ data, id, xPos, yPos }) => {
  const nodes = useStoreState((state) => state.nodes);
  const {
    setElements,
    setEditState,
    orientation,
    repaint,
    nodeTypes,
  } = useEditFlow();
  const { flushYamlValue } = useEditProperties();
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
  const onConditionAdd = useCallback(
    (ev, fullfilled) => {
      let conditionField = fullfilled ? "true" : "false";
      const { key } = ev;
      const newNodeID = getNodeId();
      const defaultNodeProperties = getDefaultNodePropertiesValue(
        nodeTypes[key].properties
      );
      const subNode = {
        id: getNodeId() + "01",
        data: {
          label: key,
          parentID: newNodeID,
          realParentID: id,
          targetHandlePosition: "top",
          nextNodeID: data.nextNodeID,
          properties: defaultNodeProperties,
        },
        position: { x: 0, y: 0 },
        type: key,
      };

      const newNode = {
        id: newNodeID,
        data: {
          label: fullfilled ? "condition_true" : "condition_false",
          targetHandlePosition: "left",
          subNodeIds: [subNode.id],
          realParentID: id,
        },
        position: { x: 0, y: 0 },
        type: "condition",
      };

      setElements((els) => {
        let nextNode = els.find(
          (el) => el.id == (fullfilled ? data.trueNextID : data.falseNextID)
        );
        //only insert sub node when already has sub node
        if (nextNode) {
          //let group node visible
          els = setNodeHidden(nextNode.data.parentID, els, false);
          //update new sub node
          subNode.data = {
            ...subNode.data,
            parentID: nextNode.data.parentID,
            nextNodeID: nextNode.id,
          };
          els = els
            .concat(subNode, {
              id: `e-${subNode.id}-${nextNode.id}`,
              source: subNode.id,
              target: nextNode.id,
              arrowHeadType: "arrow",
              type: "smoothstep",
              data: {
                parentID: nextNode.data.parentID,
                realParentID: id,
              },
            })
            .map((el) => {
              //update first sub edge target
              if (
                el.source == nextNode.data.parentID &&
                el.target == nextNode.id
              ) {
                el.target = subNode.id;
              }
              //update next node id of real parent node
              if (el.id == id) {
                el.data = {
                  ...el.data,
                  [`${conditionField}NextID`]: subNode.id,
                };
              }
              return el;
            });
          return repaint(null, els);
        }
        els = els
          .map((el) => {
            if (el.id == id) {
              el.data = {
                ...el.data,
                [`${conditionField}NodeID`]: newNodeID,
                [`${conditionField}NextID`]: subNode.id,
              };
            }
            return el;
          })
          .concat(
            newNode,
            subNode,
            //real parent node to group node edge
            {
              id: `e-${id}-${newNodeID}`,
              source: id,
              target: newNodeID,
              arrowHeadType: "arrow",
              type: "smoothstep",
              sourceHandle: fullfilled ? "b1" : "b2",
              label: fullfilled ? "True" : "False",
              style: { stroke: fullfilled ? "green" : "red" },
              data: {
                parentID: newNode.id,
                realParentID: id,
              },
            },
            //gorup node to first subNode edge
            {
              id: `e-${newNodeID}-${subNode.id}`,
              source: newNodeID,
              target: subNode.id,
              arrowHeadType: "arrow",
              type: "smoothstep",
              sourceHandle: `${newNodeID}-source-t`,
              data: {
                parentID: newNode.id,
                realParentID: id,
              },
            },
            //sub node to group node edge
            {
              id: `e-${subNode.id}-${newNodeID}`,
              source: subNode.id,
              target: newNodeID,
              arrowHeadType: "arrow",
              type: "smoothstep",
              targetHandle: `${newNodeID}-target-b`,
              data: {
                parentID: newNode.id,
                realParentID: id,
              },
            }
          );
        if (data.parentID) {
          //group node to parent group node
          els.push({
            id: `e-${newNodeID}-${data.parentID}`,
            source: newNodeID,
            target: data.parentID,
            arrowHeadType: "arrow",
            type: "smoothstep",
            data: {
              parentID: newNode.id,
              realParentID: id,
            },
            sourceHandle: `${newNodeID}-source-b`,
            targetHandle: `${data.parentID}-target-b`,
          });
        } else {
          //group node to next node edge
          els.push({
            id: `e-${newNodeID}-${data.nextNodeID}`,
            source: newNodeID,
            target: data.nextNodeID,
            arrowHeadType: "arrow",
            type: "smart",
            // animated: true,
            data: {
              parentID: newNode.id,
              realParentID: id,
            },
            sourceHandle: `${newNodeID}-source-b`,
          });
        }
        flushYamlValue(els);
        return repaint(null, els);
      });
    },
    [setElements, data]
  );
  const filterKeys = getFilterKeys(nodeTypes);
  const filterOptions = useMemo(() => {
    return filterKeys.map((key) => {
      return {
        label: key,
        value: key,
      };
    });
  }, [filterKeys]);
  // const conditionTrueMenu = getFiltersMenu((ev) => {
  //   onConditionAdd(ev, true);
  // }, nodeTypes);
  // const conditionFalseMenu = getFiltersMenu((ev) => {
  //   onConditionAdd(ev, false);
  // }, nodeTypes);

  const onAdd = useCallback(
    (ev) => {
      const { key } = ev;
      const newNodeID = getNodeId();
      const defaultNodeProperties = getDefaultNodePropertiesValue(
        nodeTypes[key].properties
      );
      const newNode = {
        id: newNodeID,
        data: {
          label: key,
          filter: key,
          parentID: data.parentID,
          nextNodeID: data.nextNodeID,
          realParentID: data.realParentID,
          properties: defaultNodeProperties,
        },
        position: { x: 0, y: 0 },
        type: key,
      };
      setElements((els) => {
        //ifelse node has multi source handle (el.data?.parentID == data.parentID)
        const nextEdge = els.find(
          (el) => el.source == id && el.data?.parentID == data.parentID
        );
        let newEls = els
          .concat(newNode, {
            id: `e-${id}-${newNodeID}`,
            source: id,
            target: newNodeID,
            arrowHeadType: "arrow",
            type: "smoothstep",
            data: {
              parentID: data.parentID,
              realParentID: data.realParentID,
            },
          })
          .map((el) => {
            if (nextEdge && el.id == nextEdge.id) {
              el.source = newNodeID;
            }
            //update target of group node out edge
            //sub if else node
            if (
              data.falseNodeID &&
              el.source == data.falseNodeID &&
              el.target == data.parentID
            ) {
              el.target = newNodeID;
            }
            if (
              data.trueNodeID &&
              el.source == data.trueNodeID &&
              el.target == data.parentID
            ) {
              el.target = newNodeID;
            }
            //root if else node
            if (
              data.trueNodeID &&
              el.source == data.trueNodeID &&
              el.target == data.nextNodeID
            ) {
              el.target = newNodeID;
            }
            if (
              data.falseNodeID &&
              el.source == data.falseNodeID &&
              el.target == data.nextNodeID
            ) {
              el.target = newNodeID;
            }

            if (el.id == id) {
              el.data = {
                ...el.data,
                nextNodeID: newNodeID,
              };
            }
            return el;
          });
        // newEls = updateLastEdgeTarget(id, newEls, newNodeID);
        flushYamlValue(newEls);
        return repaint(null, newEls);
      });
    },
    [setElements, data]
  );

  const onEditClick = useCallback(() => {
    setEditState({
      visible: true,
      component: IfElse,
      properties: data.properties || {},
      nodeID: id,
      setElements,
    });
  }, [setEditState]);

  // const swapClick = useCallback(() => {
  //   const ids = sourceEdges.map((sd) => sd.id);
  //   setElements((els) =>
  //     els.map((el) => {
  //       if (ids.some((edid) => el.id == edid)) {
  //         el.label = el.label == "IF" ? "ELSE" : "IF";
  //       }

  //       return el;
  //     })
  //   );
  // }, [sourceEdges]);

  const onDeleteClick = () => {
    setElements((els) => {
      els = deleteNode(id, els);
      flushYamlValue(els);
      return repaint(null, els);
    });
  };

  const getNodeVisible = (nodeID) => {
    if (!nodeID) {
      return null;
    }
    const targetNode = nodes.find((node) => node.id == nodeID);
    if (!targetNode) {
      return null;
    }
    return !targetNode.isHidden;
  };
  const trueNodeVisible = getNodeVisible(data.trueNodeID);
  const falseNodeVisible = getNodeVisible(data.falseNodeID);

  const onInVisibleClick = (nodeID) => {
    setElements((els) => {
      let newEls = setNodeHidden(nodeID, els);
      return repaint(null, newEls);
    });
  };
  const onVisibleClick = (nodeID) => {
    setElements((els) => {
      let newEls = setNodeHidden(nodeID, els, false);
      return repaint(null, newEls);
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
          <div className="icon-group">
            <div className="icon" onClick={onEditClick}>
              <Icon type="edit" />
            </div>
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
            <div className="icon">
              <DropdownSelect options={filterOptions} onOptionClick={onAdd}>
                <Icon type="plus" />
              </DropdownSelect>
            </div>
            {/* <div className="icon" title="swap condition" onClick={swapClick}>
              <Icon type="swap" />
            </div> */}
          </div>
        </div>
        <div className="content">
          <div style={{ display: "flex", gap: 10 }}>
            <div className="icon">
              <div className="condition-cnt">
                <div>True</div>
                <DropdownSelect
                  options={filterOptions}
                  onOptionClick={(ev) => onConditionAdd(ev, true)}
                >
                  <Icon type="plus" />
                </DropdownSelect>
                {trueNodeVisible == true && (
                  <Icon
                    type="eye-invisible"
                    onClick={() => onInVisibleClick(data.trueNodeID)}
                  />
                )}
                {trueNodeVisible == false && (
                  <Icon
                    type="eye"
                    onClick={() => onVisibleClick(data.trueNodeID)}
                  />
                )}
              </div>
            </div>
            <div className="icon">
              {/* <Dropdown overlay={conditionFalseMenu}>
                <Button>
                  False <Icon type="plus" />
                </Button>
              </Dropdown> */}
              <div className="condition-cnt">
                <div>False</div>
                <DropdownSelect
                  options={filterOptions}
                  onOptionClick={(ev) => onConditionAdd(ev, false)}
                >
                  <Icon type="plus" />
                </DropdownSelect>
                {falseNodeVisible == true && (
                  <Icon
                    type="eye-invisible"
                    onClick={() => onInVisibleClick(data.falseNodeID)}
                  />
                )}
                {falseNodeVisible == false && (
                  <Icon
                    type="eye"
                    onClick={() => onVisibleClick(data.falseNodeID)}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {data.initial_type != "input" ? (
        <Handle type="target" position={data.parentID ? "top" : "left"} />
      ) : null}
      <Handle
        type="source"
        position={data.parentID ? "bottom" : "right"}
        id="r"
      />
      <Handle
        type="source"
        position="bottom"
        id="b1"
        style={{ left: "28%" }}
        // isValidConnection={isValidConnection}
      />
      <Handle type="source" position="bottom" id="b2" style={{ left: "77%" }} />
    </div>
  );
};

_.extend(IfElseNode, {
  toObject: (data) => {
    const { filter, properties = {} } = data;
    return {};
  },
  nodeType: "if_else",
});

export default IfElseNode;
