import { Transfer } from "antd";
import React from "react";

const ApiPermission = React.forwardRef(
  ({ value = [], onChange, permissions = [] }, ref) => {
  const filterOption = (inputValue, option) =>
    option.description.indexOf(inputValue) > -1;
  const dataSource = permissions.map((p) => {
    return {
      key: p,
      title: p,
    };
  });
  return (
    <div ref={ref}>
      <Transfer
        dataSource={dataSource}
        showSearch
        filterOption={filterOption}
        targetKeys={value}
        onChange={onChange}
        render={(item) => item.title}
      />
    </div>
  );
  }
);
export default ApiPermission;
