import { Input } from "antd";

const { Search } = Input;

export default (props) => {
  const { value = "", onSearch, placeholder = null } = props;

  return (
    <Search
      allowClear
      placeholder={placeholder}
      value={value}
      enterButton
      onSearch={onSearch}
      onChange={(e) => {
        onSearch(e.currentTarget.value);
      }}
    />
  );
};
