import { Handle } from "react-flow-renderer";
import { Icon, Popover } from "antd";
import "./nodes.scss";
import { useRef } from "react";
import EditParameter from "./components/EditParameter";

const ParametersNode = ({ data }) => {
  const editFormRef = useRef();
  const content = <EditParameter formRef={editFormRef} />;
  return (
    <div className="flow-node">
      <div className="wrapper">
        <div className="header">
          <div className="title">
            <Icon
              component={VariableIcon}
              className="node-icon"
              style={{ width: 24, height: 24 }}
            />
            <span className="label">{data.label}</span>
          </div>
          <div className="icon">
            <Popover content={content} trigger="click">
              <Icon type="plus" />
            </Popover>
          </div>
        </div>
      </div>
      <Handle type="source" position="right" id="b" />
    </div>
  );
};

export default ParametersNode;

const VariableIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4.871 4A17.926 17.926 0 003 12c0 2.874.673 5.59 1.871 8m14.13 0a17.926 17.926 0 001.87-8c0-2.874-.673-5.59-1.87-8M9 9h1.246a1 1 0 01.961.725l1.586 5.55a1 1 0 00.961.725H15m1-7h-.08a2 2 0 00-1.519.698L9.6 15.302A2 2 0 018.08 16H8"
      />
    </svg>
  );
};
