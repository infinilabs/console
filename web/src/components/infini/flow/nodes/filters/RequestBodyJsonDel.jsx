import { Handle, useStoreState, removeElements } from "react-flow-renderer";
import { Icon, Popover, Dropdown } from "antd";
import "../nodes.scss";
import { useRef, useCallback, useMemo, useState } from "react";
import RequestBodyJsonDelForm from "./components/RequestBodyJsonDel";
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

// const RequestBodyJsonDelNode = ({ data, id, xPos, yPos, type, ...rest }) => {
//   const state = useStoreState((state) => state);
//   const sourceEdges = state.edges.filter((edge) => edge.source == id);
//   const isValidConnection = ({ target }) => {
//     const targetEdges = state.edges.filter((edge) => edge.target == target);
//     return targetEdges.length == 0 && sourceEdges.length == 0;
//   };
//   const { setElements, setEditState, orientation } = useEditFlow();

//   const onAdd = useCallback(
//     (ev) => {
//       const { key } = ev;
//       const newNodeID = getNodeId();
//       const nextPos =
//         orientation == "horizontal"
//           ? {
//               x: xPos + settings.nodeOffsetX,
//               y: yPos,
//             }
//           : {
//               x: xPos,
//               y: yPos + settings.nodeOffsetY,
//             };
//       const newNode = {
//         id: newNodeID,
//         data: { label: key, filter: key },
//         position: nextPos,
//         type: key,
//       };
//       setElements((els) =>
//         els.concat(newNode, {
//           id: `e-${id}-${newNodeID}`,
//           source: id,
//           target: newNodeID,
//           arrowHeadType: "arrow",
//           type: "smoothstep",
//         })
//       );
//     },
//     [setElements, xPos, yPos]
//   );

//   const onEditClick = useCallback(() => {
//     setEditState({
//       visible: true,
//       component: RequestBodyJsonDelForm,
//       properties: data.properties || {},
//       nodeID: id,
//       setElements,
//     });
//   }, [setEditState]);
//   const onDeleteClick = () => {
//     setElements((els) =>
//       els.filter((el) => {
//         if (el.id == id) {
//           removeElements([el], els);
//           return false;
//         }
//         return true;
//       })
//     );
//   };

//   const menu = getFiltersMenu(onAdd);
//   return (
//     <div className="flow-node">
//       <div className="wrapper">
//         <div className="header">
//           <div className="title">
//             <Icon type="snippets" className="node-icon" />
//             <span className="label">{data.label}</span>
//           </div>
//           <div className="icon-group">
//             <div className="icon" onClick={onEditClick}>
//               <Icon type="edit" />
//             </div>
//             <div className="icon" onClick={onDeleteClick}>
//               <Icon type="delete" />
//             </div>
//             {sourceEdges.length == 0 ? (
//               <div className="icon">
//                 <Dropdown overlay={menu}>
//                   <Icon type="plus" />
//                 </Dropdown>
//               </div>
//             ) : null}
//           </div>
//         </div>
//       </div>
//       {data.initial_type != "input" ? (
//         <Handle
//           type="target"
//           id={`${id}-target`}
//           position={orientation == "horizontal" ? "left" : "top"}
//         />
//       ) : null}
//       {!isOutputNode(type) ? (
//         <Handle
//           type="source"
//           position={orientation == "horizontal" ? "right" : "bottom"}
//           id={`${id}-source`}
//           isValidConnection={isValidConnection}
//         />
//       ) : null}
//     </div>
//   );
// };
const RequestBodyJsonDelNode = (props = {}) => {
  const { data, id, xPos, yPos, type, ...rest } = props;
  const { setElements } = useEditFlow();

  return <BaseNode {...props} EditComponent={RequestBodyJsonDelForm} />;
};

_.extend(RequestBodyJsonDelNode, {
  toObject: (data = {}) => {
    const filter = RequestBodyJsonDelNode.nodeType;
    const { properties = { path: [] } } = data;
    let result = {
      [filter]: {
        path: [...properties.path],
      },
    };
    if (properties.when) {
      result[filter].when = getConditionObject(properties.when);
    }
    return result;
  },
  nodeType: "request_body_json_del",
  parseObject: (data) => {
    data = data || {};
    let result = {
      path: data.path || [],
    };
    if (data.when) {
      result["when"] = parseConditionObject(data.when);
    }
    return result;
  },
});

export default RequestBodyJsonDelNode;
