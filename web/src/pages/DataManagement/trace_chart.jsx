import "./trace_chart.scss";
import { Icon } from "antd";
import React, { useCallback, useState } from "react";

export default ({ data, toogleFilter }) => {
  const [selectedKey, setSelectedKey] = useState("");
  const selectedKeyRef = React.useRef();
  selectedKeyRef.current = selectedKey;
  const onItemClick = (itemData) => {
    if (toogleFilter && typeof toogleFilter == "function") {
      toogleFilter(
        itemData.aggField,
        itemData.key,
        itemData.key == selectedKeyRef.current ? "remove" : "add"
      );
    }
    setSelectedKey(itemData.key == selectedKeyRef.current ? "" : itemData.key);
  };
  return (
    <div className="trace-cnt">
      <div className="trace-list">
        {(data || []).map((item) => {
          return (
            <>
              <div
                className={`trace-item ${
                  selectedKey == item.key ? "selected" : ""
                }`}
                onClick={(e) => {
                  onItemClick(item);
                }}
              >
                <div>
                  <p className="text">{item.key}</p>
                  <p className="time">{item.timestamp}</p>
                </div>
              </div>
              <div className="arrow">
                <Icon type="right" className="arrow-icon" />
              </div>
            </>
          );
        })}
      </div>
    </div>
  );
};
