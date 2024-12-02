import { Handle, useStoreState } from "react-flow-renderer";
import { Select, Icon } from "antd";
import "./nodes.scss";
import { useRef, useCallback, useMemo } from "react";
import { getFiltersMap, getNodeId } from "./filters";
import { useEditFlow } from "../EditSearchFlowContext";

const filtersMap = getFiltersMap();

const InitialNode = ({ data }) => {
  const { setElements } = useEditFlow();
  const onFilterChange = useCallback((value) => {
    setElements((els) => [
      {
        id: getNodeId(),
        data: { label: value, filter: value, initial_type: "input" },
        position: {
          x: 20,
          y: 50,
        },
        type: value,
      },
    ]);
  }, []);

  return (
    <div className="flow-node">
      <div className="wrapper">
        <div className="header">
          <div className="title">
            <Icon type="play-circle" className="node-icon" />
            <span className="label">{data.label}</span>
          </div>
        </div>
        <div className="content">
          <div className="row">
            <div className="label">Select Filter</div>
            <div className="value">
              <Select onChange={onFilterChange} style={{ width: "100%" }}>
                {Object.keys(filtersMap).map((key) => {
                  return (
                    <Select.Option key={key} value={key}>
                      {key}
                    </Select.Option>
                  );
                })}
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InitialNode;
