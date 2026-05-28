import { Input } from "antd";
import { formatMessage } from "umi/locale";

const { Search } = Input;

export default (props) => {
  const { value = "", onSearch, placeholder = null } = props;
  const handleSearch = (nextValue) => {
    onSearch(`${nextValue ?? ""}`.trim());
  };

  return (
    <Search
      allowClear
      placeholder={placeholder}
      value={value}
      enterButton={formatMessage({ id: "form.button.search" })}
      onSearch={handleSearch}
      onChange={(e) => {
        onSearch(e.currentTarget.value);
      }}
      onBlur={(e) => {
        handleSearch(e.currentTarget.value);
      }}
    />
  );
};
