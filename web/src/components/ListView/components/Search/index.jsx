import { Input } from "antd";
import { formatMessage } from "umi/locale";

const { Search } = Input;

export default (props) => {
  const { value = "", onSearch, placeholder = null } = props;

  return (
    <Search
      allowClear
      placeholder={placeholder}
      value={value}
      enterButton={formatMessage({ id: "form.button.search" })}
      onSearch={onSearch}
      onChange={(e) => {
        onSearch(e.currentTarget.value);
      }}
    />
  );
};
