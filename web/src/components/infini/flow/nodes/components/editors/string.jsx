import { Input } from "antd";
const StringEditor = ({ value, onChange, metadata }) => {
  return (
    <div>
      <Input
        style={{ width: 250 }}
        value={value}
        onChange={(ev) => {
          onChange(ev.target.value);
        }}
      />
    </div>
  );
};

export default StringEditor;
