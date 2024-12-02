import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
import ReactFlow, {
  ReactFlowProvider,
  removeElements,
  addEdge,
  useZoomPanHelper,
  useStoreState,
  useUpdateNodeInternals,
  useStoreActions,
} from "react-flow-renderer";
import "./EditSearchFlow.scss";
// import Controls from "./Controls";

import {
  EditSearchFlowProvider,
  EditPropertiesProvider,
  useEditProperties,
} from "./EditSearchFlowContext";
import InitialNode from "./nodes/Initial";
import {
  getFiltersMap,
  settings,
  collectNodeValue,
  parseElements,
  repaint,
  createFilterNodes,
  registFilters,
} from "./nodes/filters";
import EditorWapper from "./EditorWapper";
import YamlViewer from "./YamlViewer";
import yaml from "js-yaml";
import { SmartEdge, SmartEdgeProvider } from "./SmartEdge";
import { debounce } from "lodash";
import ObjectEditor from "./nodes/components/editors/ObjectEditor";
import moment from "moment";
import { Icon, Radio, Button } from "antd";
import { EditableTitle } from "../editable_title";

const EditFlow = ({
  orientation = "horizontal",
  setYamlValue,
  elements,
  setElements,
  nodeTypes,
  onSaveClick,
  hidden,
}) => {
  const [rfInstance, setRfInstance] = useState();
  // const [elements, setElements] = useState(initialElements);
  const onElementsRemove = (elementsToRemove) =>
    setElements((els) => removeElements(elementsToRemove, els));

  const onConnect = (params) =>
    setElements((els) => {
      params.arrowHeadType = "arrow";
      return addEdge(params, els);
    });
  const nodes = useStoreState((store) => store.nodes);
  const { setEditState, editState } = useEditProperties();

  const setSelectedElements = useStoreActions(
    (actions) => actions.setSelectedElements
  );

  const [nodesDraggable, setNodesDraggable] = useState(false);
  const onNodeMouseEnter = () => {
    setSelectedElements(
      rfInstance.getElements()
      // nodes.map((node) => ({ id: node.id, type: node.type }))
    );
    setNodesDraggable(true);
  };
  const onNodeMouseLeave = () => {
    setNodesDraggable(false);
    console.log(nodes);
  };
  let style = {};
  if (hidden) {
    style = { height: 0 };
  }

  return (
    <div className={"search-flow-edit-cnt"} style={style}>
      <EditSearchFlowProvider
        value={{
          setElements,
          setEditState,
          editState,
          orientation,
          rfInstance,
          repaint,
          nodeTypes,
        }}
      >
        <SmartEdgeProvider
          options={{
            debounceTime: 100,
            nodePadding: 10,
            gridRatio: 15,
            lineType: "straight",
            lessCorners: true,
          }}
        >
          <ReactFlow
            nodeTypes={nodeTypes}
            edgeTypes={{
              smart: SmartEdge,
            }}
            nodesDraggable={nodesDraggable}
            // nodesConnectable={false}
            // elementsSelectable={false}
            className="flow"
            elements={elements}
            // onElementsRemove={onElementsRemove}
            onConnect={onConnect}
            onLoad={setRfInstance}
            // onNodeDragStop={(e, node)=>{
            //   console.log(e, node)
            // }}
            // onNodeMouseEnter={onNodeMouseEnter}
            // onNodeMouseLeave={onNodeMouseLeave}
          >
            {/* <Controls
              rfInstance={rfInstance}
              setElements={setElements}
              onSaveClick={onSaveClick}
            /> */}
          </ReactFlow>
        </SmartEdgeProvider>
      </EditSearchFlowProvider>
    </div>
  );
};
const valueToElements = (value, nodeTypes) => {
  value = value || [];
  if (value.length == 0) {
    return [
      {
        id: "1",
        data: { label: "Input", nextNodeID: "2" },
        position: { x: 20, y: 50 },
        type: "start",
      },
      {
        id: "2",
        data: { label: "Output" },
        position: { x: 500, y: 50 },
        type: "stop",
      },
      {
        id: "e-1-x",
        source: "1",
        target: "2",
        arrowHeadType: "arrow",
      },
    ];
  }
  let els = parseElements(value, null, null, true, "2", nodeTypes);
  const firstNode = els.find((el) => el.data?.isFirstNode == true);
  if (!firstNode) {
    console.log("can not find first node");
    return [];
  }
  els = els.concat(
    {
      id: "1",
      data: { label: "Input", nextNodeID: firstNode.id },
      position: { x: 20, y: 50 },
      type: "start",
    },
    {
      id: "2",
      data: { label: "Output" },
      position: { x: 500, y: 50 },
      type: "stop",
    },
    {
      id: "e-1-x",
      source: "1",
      target: firstNode.id,
      arrowHeadType: "arrow",
    }
  );
  els = repaint(null, els);
  return els;
};
const defaultFlowName = "new_flow_name";
export const EditFlowUI = (props) => {
  const filterMap = props.filterMap || {};

  const nodeTypes = useMemo(() => {
    const businessNodes = createFilterNodes(filterMap);
    const filterNodes = getFiltersMap();
    return {
      ...businessNodes,
      ...filterNodes,
    };
  }, [filterMap]);
  const [editState, setEditState] = useState({
    component: () => null,
    visible: false,
    properties: {},
    nodeID: "",
  });

  const onEditorVisbleChange = (visible) => {
    setEditState({
      ...editState,
      visible,
    });
  };
  const initialValue = props.initialValue || {
    name: defaultFlowName,
    filter: [],
  };
  const flowNameRef = useRef(initialValue.name);
  const [yamlValue, setYamlValue] = useState(yaml.dump(initialValue));
  const yamlInitialRef = useRef(yamlValue);
  const [elements, setElements] = useState(
    valueToElements(initialValue.filter, nodeTypes)
  );
  const onYamlValueChange = useCallback(
    debounce((text) => {
      let jsonValue = null;
      try {
        jsonValue = yaml.load(text);
      } catch (e) {}
      if (!jsonValue) return;
      //update flowName
      flowNameRef.current = jsonValue.name;
      const els = valueToElements(jsonValue.filter, nodeTypes);
      setElements(els);
      setYamlValue(text);
    }, 800),
    [setYamlValue]
  );

  const getFlowValue = useCallback(
    (els, flowName) => {
      const startNode = els.find((node) => node.type == "start");
      const filtersResult = [];
      for (
        let nextNode = startNode;
        nextNode;
        nextNode = els.find((el) => nextNode.data.nextNodeID == el.id)
      ) {
        if (nextNode.type == "start" || nextNode.type == "stop") {
          continue;
        }
        if (nextNode.type == "if_else") {
          filtersResult.push(collectNodeValue(nextNode.id, els, nodeTypes));
        } else {
          const obj = nodeTypes[nextNode.type].toObject(nextNode.data);
          filtersResult.push(obj);
        }
      }
      // console.log(JSON.stringify(filtersResult));
      // const yamlText = yaml.dump();
      // console.log(yaml.load(yamlText));
      // return yamlText;
      return { name: flowName, filter: filtersResult };
    },
    [nodeTypes]
  );

  const onSaveClick = useCallback(() => {
    if (typeof props.onSaveClick == "function") {
      setElements((els) => {
        const flowValue = getFlowValue(els, flowNameRef.current);
        props.onSaveClick(flowValue);
        return els;
      });
    }
  }, [props.onSaveClick, getFlowValue, setElements]);

  const flushYamlValue = useCallback(
    (els) => {
      setYamlValue((oldValue) => {
        const flowValue = getFlowValue(els, flowNameRef.current);
        return yaml.dump(flowValue);
      });
    },
    [setYamlValue]
  );
  const [view, setView] = useState("graph");
  const onFlowNameChange = useCallback(
    debounce((val) => {
      flowNameRef.current = val;
      setYamlValue((oldValue) => {
        let jsonValue = null;
        try {
          jsonValue = yaml.load(oldValue);
        } catch (e) {}
        if (!jsonValue) oldValue;
        jsonValue.name = val;
        return yaml.dump(jsonValue);
      });
    }, 500),
    [setYamlValue]
  );

  return (
    <EditPropertiesProvider value={{ editState, setEditState, flushYamlValue }}>
      <div className="edit-flow-ui">
        <div className="header">
          <div className="flow-name">
            <EditableTitle
              title={flowNameRef.current}
              onTitleChange={onFlowNameChange}
            />
          </div>
          <div className="views">
            <Radio.Group
              value={view}
              onChange={(e) => {
                setView(e.target.value);
              }}
              buttonStyle="solid"
            >
              <Radio.Button value="graph">Graph</Radio.Button>
              <Radio.Button value="yaml">Yaml</Radio.Button>
            </Radio.Group>
          </div>
          <div className="right">
            <div>
              <Button
                type="primary"
                disabled={yamlInitialRef.current == yamlValue}
                onClick={onSaveClick}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
        <div
          className="graph-flow"
          style={{ display: view == "graph" ? "flex" : "none" }}
        >
          <ReactFlowProvider>
            <EditFlow
              {...props}
              setYamlValue={setYamlValue}
              initialValue={elements}
              elements={elements}
              setElements={setElements}
              nodeTypes={nodeTypes}
              onSaveClick={onSaveClick}
              hidden={view != "graph"}
            />
          </ReactFlowProvider>
          <EditorWapper
            visible={editState.visible}
            onVisibleChange={onEditorVisbleChange}
            Component={editState.component}
          />
        </div>
        <div style={{ display: view == "yaml" ? "block" : "none" }}>
          <YamlViewer value={yamlValue} onChange={onYamlValueChange} />
        </div>
      </div>
    </EditPropertiesProvider>
  );
};

// export default (props) => {
// const [editorValue, setEditorValue] = useState({
//   name: "silenceqi",
//   age: 32,
//   birthday: moment("1989-09-08"),
//   department: "研发部",
//   bigger: true,
// });
// useEffect(() => {
//   console.log(editorValue);
// }, [editorValue]);
// return (
//   <PageHeaderWrapper>
{
  /* <ObjectEditor
        value={editorValue}
        onChange={setEditorValue}
        label="test property"
        properties={{
          name: { type: "string" },
          age: { type: "number" },
          birthday: { type: "date" },
          department: {
            type: "enum",
            options: [
              { label: "研发部", value: "研发部" },
              { label: "设计部", value: "设计部" },
            ],
          },
          bigger: { type: "bool" },
        }}
      /> */
}
//       <EditFlowUI {...props} />
//     </PageHeaderWrapper>
//   );
// };
