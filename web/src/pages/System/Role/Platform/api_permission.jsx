import { Transfer } from "antd";

const ApiPermission = ({ value = [], onChange, permissions = [] }) => {
  const filterOption = (inputValue, option) =>
    option.description.indexOf(inputValue) > -1;
  const dataSource = permissions.map((p) => {
    return {
      key: p,
      title: p,
    };
  });
  return (
    <Transfer
      dataSource={dataSource}
      showSearch
      filterOption={filterOption}
      targetKeys={value}
      onChange={onChange}
      render={(item) => item.title}
    />
  );
};
export default ApiPermission;
