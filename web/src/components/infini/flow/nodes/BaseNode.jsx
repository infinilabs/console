import {
  Handle,
  useStoreState,
  removeElements,
  useUpdateNodeInternals,
} from "react-flow-renderer";
import { Icon, Popover, Dropdown, Popconfirm } from "antd";
import "./nodes.scss";
import { useRef, useCallback, useMemo, useState, useEffect } from "react";
import {
  getFilterKeys,
  getNodeId,
  getNextHandlePostion,
  getConditionObject,
  settings,
  isOutputNode,
  deleteNode,
  getDefaultNodePropertiesValue,
} from "./filters";
import { useEditFlow, useEditProperties } from "../EditSearchFlowContext";
import _ from "lodash";
import DropdownSelect from "./components/DropdownSelect";

const BaseNode = ({
  data,
  id,
  xPos,
  yPos,
  type,
  editable = true,
  deletable = true,
  addable = true,
  EditComponent = () => null,
  iconType = "snippets",
  ...rest
}) => {
  const nodes = useStoreState((state) => state.nodes);
  const {
    setElements,
    setEditState,
    rfInstance,
    repaint,
    nodeTypes,
  } = useEditFlow();
  const { flushYamlValue } = useEditProperties();

  const onEditClick = useCallback(() => {
    setEditState({
      visible: true,
      component: EditComponent,
      properties: data.properties || {},

      nodeID: id,
      setElements,
    });
  }, [setEditState, data]);

  const onDeleteClick = useCallback(() => {
    const elements = rfInstance.getElements();
    let els = deleteNode(id, elements);
    els = repaint(null, els);
    flushYamlValue(els);
    setElements(els);
    // if (data.parentID) repaint(data.parentID);
  }, [rfInstance, setElements]);
  const onAdd = useCallback(
    (ev) => {
      const { key } = ev;
      const newNodeID = getNodeId();
      // const nextPos = {
      //   x: xPos + settings.nodeOffsetX,
      //   y: yPos,
      // };
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
        // position: nextPos,
        type: key,
        // draggable: false,
      };
      setElements((els) => {
        const nextEdge = els.find((el) => el.source == id);
        els = els
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
            if (el.id == id) {
              el.data = {
                ...el.data,
                nextNodeID: newNodeID,
              };
            }
            //update condition node data
            if (data.parentID && el.id == data.parentID) {
              el.data = {
                ...el.data,
                // subNodeIds: [...el.data.subNodeIds, newNode.id],
              };
            }
            return el;
          });
        flushYamlValue(els);
        return repaint(null, els);
      });

      // if (data.parentID) repaint(data.parentID);
    },
    [setElements, xPos, yPos, data]
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
  const rootRef = useRef();
  useEffect(() => {
    setElements((els) =>
      els.map((el) => {
        if (el.id == id) {
          el.data = {
            ...el.data,
            width: rootRef.current?.offsetWidth,
          };
        }
        if (data.parentID && el.id == data.parentID) {
          el.data = {
            ...el.data,
            widthChanged: (el.data.widthChanged || 0) + 1,
          };
        }
        return el;
      })
    );
  }, [rootRef.current?.offsetWidth]);
  // const isSubFirstNode = useMemo(() => {
  //   if (!data.parentID) {
  //     return false;
  //   }
  //   const realParentNode = nodes.find((n) => n.id == data.realParentID);
  //   if (!realParentNode) {
  //     console.warn("cant not find real parent node");
  //     return false;
  //   }
  //   return (
  //     realParentNode.data.trueNextID == id ||
  //     realParentNode.data.falseNextID == id
  //   );
  // }, [nodes]);

  // const updateNodeInternals = useUpdateNodeInternals();
  // useEffect(() => {
  //   updateNodeInternals(id);
  // }, [isSubFirstNode]);
  return (
    <div className="flow-node" ref={rootRef}>
      {data.properties?.when ? (
        <div className="when-icon">
          <Icon type="question-circle" />
        </div>
      ) : null}
      <div className="wrapper">
        <div className="header">
          <div className="title">
            <Icon type={iconType} className="node-icon" />
            <span className="label">{data.label}</span>
          </div>
          <div className="icon-group">
            {editable ? (
              <div className="icon" onClick={onEditClick}>
                <Icon type="edit" />
              </div>
            ) : null}
            {deletable ? (
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
            ) : null}
            {addable ? (
              <div className="icon">
                <DropdownSelect options={filterOptions} onOptionClick={onAdd}>
                  <Icon type="plus" />
                </DropdownSelect>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      {type != "start" ? (
        <Handle
          type="target"
          position={data.parentID ? "top" : "left"}
          id={`${id}-target`}
        />
      ) : null}
      {!isOutputNode(type) ? (
        <Handle
          type="source"
          position={data.parentID ? "bottom" : "right"}
          id={`${id}-source`}
        />
      ) : null}
    </div>
  );
};

export default BaseNode;
