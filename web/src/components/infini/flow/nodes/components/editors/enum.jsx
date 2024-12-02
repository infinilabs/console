import { Select } from "antd";
const EnumEditor = ({ value, onChange, metadata = {} }) => {
  const options = metadata.options || [];
  return (
    <Select onChange={onChange} value={value}>
      {options.map((op) => {
        return (
          <Select.Option key={op.label} value={op.value}>
            {op.label}
          </Select.Option>
        );
      })}
    </Select>
  );
};

export default EnumEditor;
