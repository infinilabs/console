import InputSelect from "@/components/infini/InputSelect";
import { useMemo, useState } from "react";
import { Input, Button } from "antd";
import ArrayEditor from "../editors/ArrayEditor";

export default (props) => {
  const [value, setValue] = useState(props.value || {});
  let handleValueChange = (key, v) => {
    setValue((oldVal) => {
      let newV = {
        ...oldVal,
        [key]: v,
      };
      props.onChange && props.onChange(newV);
      return newV;
    });
  };
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center" }}>
        <div>{value.condition_type}</div>
        <div style={{ marginLeft: "auto" }}>
          <Button icon="delete" onClick={props.onRemove} />
        </div>
      </div>
      <div>
        <Input
          placeholder="context field"
          value={value.field}
          style={{ width: 250 }}
          onChange={(v) => {
            handleValueChange("field", v.target.value);
          }}
        />
      </div>
      <div style={{ marginTop: 10 }}>
        <ArrayEditor
          value={value.value}
          onChange={(v) => handleValueChange("value", v)}
          metadata={{ sub_type: "string" }}
          addButtonTooltip="add in value"
        />
      </div>
    </div>
  );
};
