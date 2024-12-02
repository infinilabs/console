import { useMemo, useState } from "react";
import { Select, Input, Button, message } from "antd";

export default (props) => {
  // const [value, setValue] = useState(props.value || {});
  const value = props.value || {};
  let handleValueChange = (key, v) => {
    // setValue((oldVal) => {
    let newV = {
      // ...oldVal,
      ...value,
      [key]: v,
    };
    props.onChange && props.onChange(newV);
    // });
  };
  const innerValueChange = (innerValue, i) => {
    value.value = value.value || [{}, {}];
    value.value[i] = innerValue;
    let newV = {
      ...value,
    };
    props.onChange && props.onChange(newV);
  };
  value.value = value.value || [];

  let ltValue = {};
  let ltIndex = -1;
  let gtValue = {};
  let gtIndex = -1;
  value.value.forEach((v, i) => {
    if (v.field == "gt" || v.field == "gte") {
      gtValue = v;
      gtIndex = i;
    } else if (v.field == "lt" || v.field == "lte") {
      ltValue = v;
      ltIndex = i;
    }
  });
  if (ltIndex == -1 && gtIndex == -1) {
    ltIndex = 0;
    gtIndex = 1;
  } else if (ltIndex > -1 && gtIndex > -1) {
  } else if (ltIndex > -1) {
    gtIndex = 1;
  } else {
    ltIndex = 1;
  }

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
        <div style={{ marginBottom: 10 }}>
          <LTRangeItem
            value={ltValue}
            onChange={(val) => {
              innerValueChange(val, ltIndex);
            }}
          />
        </div>
        <div>
          <GTRangeItem
            value={gtValue}
            onChange={(val) => {
              innerValueChange(val, gtIndex);
            }}
          />
        </div>
      </div>
    </div>
  );
};

const LTRangeItem = (props) => {
  const value = props.value || {};
  const handleValueChange = (key, v) => {
    let newV = {
      ...value,
      [key]: v,
    };
    props.onChange && props.onChange(newV);
    return newV;
  };
  return (
    <div>
      <Input.Group compact>
        <Select
          style={{ width: "30%" }}
          value={value.field}
          onChange={(v) => {
            handleValueChange("field", v);
          }}
        >
          <Select.Option value="lt">lt</Select.Option>
          <Select.Option value="lte">lte</Select.Option>
        </Select>
        <Input
          style={{ width: "70%" }}
          value={value.value}
          onChange={(v) => {
            handleValueChange("value", v.target.value);
          }}
        />
      </Input.Group>
    </div>
  );
};

const GTRangeItem = (props) => {
  const value = props.value || {};
  const handleValueChange = (key, v) => {
    let newV = {
      ...value,
      [key]: v,
    };
    props.onChange && props.onChange(newV);
    return newV;
  };
  return (
    <div>
      <Input.Group compact>
        <Select
          style={{ width: "30%" }}
          value={value.field}
          onChange={(v) => {
            handleValueChange("field", v);
          }}
        >
          <Select.Option value="gt">gt</Select.Option>
          <Select.Option value="gte">gte</Select.Option>
        </Select>
        <Input
          style={{ width: "70%" }}
          value={value.value}
          onChange={(v) => {
            handleValueChange("value", v.target.value);
          }}
        />
      </Input.Group>
    </div>
  );
};
