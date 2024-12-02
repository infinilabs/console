import { Select } from "antd";
import { useEffect, useState } from "react";
import "./search_facet.scss";

const SearchSelectFacet = ({ field, label, data = [], onChange }) => {
  const onSelectChange = (v) => {
    if (typeof onChange == "function") {
      if (v == "_all") {
        return onChange({
          field,
          value: [],
        });
      }
      return onChange({
        field,
        value: [v],
      });
    }
  };
  return (
    <div className="search-select-facet">
      <div className="search-facet-line label">{label}:</div>
      <div className="search-facet-line">
        <Select
          style={{ width: 150 }}
          value={data.length > 1 ? "_all" : data[0]?.key}
          onChange={onSelectChange}
        >
          <Select.Option key="all" value="_all">
            ALL
          </Select.Option>
          {data.map((item) => {
            return (
              <Select.Option key={item.key} value={item.key}>
                {item.key}
              </Select.Option>
            );
          })}
        </Select>
      </div>
    </div>
  );
};

export default SearchSelectFacet;
