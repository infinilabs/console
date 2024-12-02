import { Dropdown, Input, Menu } from "antd";
import { useState } from "react";
import "./DropdownSelect.scss";

const DropdownSelect = (props) => {
  const [visible, setVisible] = useState(false);
  const [filterdOptions, setFilterOptions] = useState(props.options || []);

  const onFilterChange = (ev) => {
    const options = (props.options || []).filter((op) => {
      return op.label.includes(ev.target.value);
    });
    setFilterOptions(options);
  };

  const menu = (
    <div className="ds-wrapper">
      <div>
        <Input
          className="filter"
          placeholder="input to filter"
          onChange={onFilterChange}
        />
      </div>
      <div>
        <div className="ds-list">
          {filterdOptions.map((option) => {
            return (
              <div
                className="ds-item"
                key={option.value}
                onClick={() => {
                  props.onOptionClick({ key: option.value });
                  setVisible(false);
                }}
              >
                {option.label}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
  return (
    <Dropdown visible={visible} onVisibleChange={setVisible} overlay={menu}>
      {props.children}
    </Dropdown>
  );
};

export default DropdownSelect;
