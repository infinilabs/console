import { Switch } from "antd";
const BoolEditor = ({ value, onChange, metadata = {} }) => {
  return <Switch checked={value} onChange={onChange} />;
};

export default BoolEditor;
