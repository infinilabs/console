import PageHeaderWrapper from "@/components/PageHeaderWrapper";
import React, { useState, useCallback, useEffect } from "react";
import ReactFlow, {
  ReactFlowProvider,
  removeElements,
  addEdge,
  useZoomPanHelper,
  useStoreState,
} from "react-flow-renderer";
import "./EditSearchFlow.scss";
import Controls from "./Controls";
import QueryDSLNode from "./nodes/QueryDSL";
import Condition from "./nodes/Condition";
// import CustomEdge from "./nodes/CustomEdge";
import { EditSearchFlowProvider } from "./EditSearchFlowContext";
import InputQueryDSLNode from "./nodes/InputQueryDSL";
import OutputQueryDSLNode from "./nodes/OutputQueryDSL";
import Variables from "./Variables";

const extractConditionVariables = (value, variables = {}) => {
  if (!value) {
    return variables;
  }
  if (value.field && value.field.startsWith("_ctx.variables.")) {
    variables[value.field.slice(15)] = {
      type: "field",
      condition_type: value.condition_type,
    };
    if (value.value && value.value.startsWith("_ctx.variables.")) {
      variables[value.value.slice(15)] = {
        type: "value",
        condition_type: value.condition_type,
      };
    }

    return variables;
  }
  if (value.conditions && value.conditions.length > 0) {
    value.conditions.map((cond) => {
      extractConditionVariables(cond, variables);
    });
  }
  return variables;
};

const initialElements = [];

const EditSearchFlow = () => {
  const [rfInstance, setRfInstance] = useState();
  const [elements, setElements] = useState(initialElements);
  const onElementsRemove = (elementsToRemove) =>
    setElements((els) => removeElements(elementsToRemove, els));

  const onConnect = (params) =>
    setElements((els) => {
      params.arrowHeadType = "arrow";
      return addEdge(params, els);
    });

  const [variables, setVariables] = useState({});
  useEffect(() => {
    let variables = {};
    elements.forEach((el) => {
      let newVars = {};
      switch (el.type) {
        case "condition":
          newVars = extractConditionVariables(el.data.condition_value, newVars);
      }
      variables = {
        ...variables,
        ...newVars,
      };
    });
    setVariables(variables);
  }, [elements]);

  return (
    <div className="search-flow-edit-cnt">
      <EditSearchFlowProvider
        value={{
          setElements,
          setVariables,
        }}
      >
        <ReactFlow
          nodeTypes={{
            query_dsl: QueryDSLNode,
            condition: Condition,
            input_query_dsl: InputQueryDSLNode,
            output_query_dsl: OutputQueryDSLNode,
          }}
          className="flow"
          elements={elements}
          onElementsRemove={onElementsRemove}
          onConnect={onConnect}
          onLoad={setRfInstance}
        >
          <Controls rfInstance={rfInstance} setElements={setElements} />
          <Variables variables={variables} />
        </ReactFlow>
      </EditSearchFlowProvider>
    </div>
  );
};

export default (props) => {
  return (
    <PageHeaderWrapper>
      <ReactFlowProvider>
        <EditSearchFlow {...props} />
      </ReactFlowProvider>
    </PageHeaderWrapper>
  );
};
