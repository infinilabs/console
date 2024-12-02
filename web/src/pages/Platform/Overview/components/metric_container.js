import React, { useState } from "react";
import "./metric_container.scss";
import { Icon } from "antd";

export default ({ children, title, collapsed = true, id }) => {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  return (
    <div data-metric-container className={isCollapsed ? "collapsed" : ""}>
      <div id={id} className="header">
        <div
          className="collapse-icon"
          onClick={() => {
            setIsCollapsed(!isCollapsed);
          }}
        >
          <Icon
            style={{ fontSize: 12 }}
            type={isCollapsed ? "right" : "down"}
          />
        </div>
        <div className="h-item title">{title}</div>
      </div>

      {!isCollapsed ? (
        <div className="body">
          <div className="wrapper">{children}</div>
        </div>
      ) : null}
    </div>
  );
};
