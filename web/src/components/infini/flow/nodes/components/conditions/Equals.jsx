import { Input, Button } from "antd";

export default ({ label = "equals" }) => {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center" }}>
        <div>{label}</div>
        <Input.Group compact>
          <Input placeholder="context field" style={{ width: "30%" }} />
          <Input
            value={value.value}
            onChange={(v) => {
              handleValueChange("value", v.target.value);
            }}
            placeholder="请输入值"
            style={{ width: "30%" }}
          />
          <Button
            icon="delete"
            style={{ width: "10%", marginLeft: 10 }}
            onClick={() => props.onRemove(props.level, props.rowID)}
          />
        </Input.Group>
      </div>
    </div>
  );
};
