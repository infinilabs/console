import { Handle, useStoreState } from "react-flow-renderer";
import { Icon, Popover } from "antd";
import "./nodes.scss";
import { useRef, useCallback, useMemo } from "react";
import DependcyDSL from "./components/DependcyDSL";

const QueryDSLNode = ({ data, id, type = "default" }) => {
  const state = useStoreState((state) => state);
  const sourceEdges = state.edges.filter((edge) => edge.source == id);
  const editFormRef = useRef();
  const content = useMemo(() => {
    return <DependcyDSL formRef={editFormRef} />;
  }, [editFormRef]);
  const isValidConnection = ({ target }) => {
    const targetEdges = state.edges.filter((edge) => edge.target == target);
    return targetEdges.length == 0 && sourceEdges.length == 0;
  };
  return (
    <div className="flow-node">
      <div className="wrapper">
        <div className="header">
          <div className="title">
            <Icon type="snippets" className="node-icon" />
            <span className="label">{data.label}</span>
          </div>
          <div className="icon">
            <Popover content={content} trigger="click">
              <Icon type="edit" />
            </Popover>
          </div>
        </div>
      </div>
      {type != "input" ? <Handle type="target" position="left" /> : null}
      {type != "output" ? (
        <Handle
          type="source"
          position="right"
          id="r"
          isValidConnection={isValidConnection}
        />
      ) : null}
    </div>
  );
};

export default QueryDSLNode;
