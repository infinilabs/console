import { Select, Input, Button } from "antd";
import TagEditor from "@/components/infini/TagEditor";
import { useEffect, useState } from "react";
import { useGatewayRouter } from "./context";

const httpMethods = [
  "GET",
  "PUT",
  "POST",
  "DELETE",
  "HEAD",
  "CONNECT",
  "OPTIONS",
  "PATCH",
  "TRACE",
];

const Rule = (props) => {
  const [value, setValue] = useState(props.value);
  useEffect(() => {
    if (props.value) {
      setValue(props.value);
    }
  }, [props.value]);
  const { flows } = useGatewayRouter();
  const onFieldChange = (field, value) => {
    setValue((v) => {
      const newVal = {
        ...v,
        [field]: value,
      };
      if (typeof props.onChange == "function") {
        props.onChange(newVal);
      }
      return newVal;
    });
  };
  const onSaveClick = () => {
    console.log(JSON.stringify(value));
  };
  return (
    <div>
      <div>
        <div>Method: </div>
        <div>
          <Select
            style={{ width: "100%" }}
            mode="tags"
            value={value.method}
            onChange={(val) => onFieldChange("method", val)}
          >
            {httpMethods.map((m) => {
              return (
                <Select.Option key={m} value={m}>
                  {m}
                </Select.Option>
              );
            })}
          </Select>
        </div>
      </div>
      <div style={{ marginTop: 10 }}>
        <div>Path Pattern: </div>
        <div>
          <TagEditor
            value={value.pattern}
            onChange={(val) => onFieldChange("pattern", val)}
          />
        </div>
      </div>
      <div style={{ marginTop: 10 }}>
        <div>Flow: </div>
        <div>
          <Select
            mode="tags"
            style={{ width: "100%" }}
            value={value.flow}
            onChange={(val) => onFieldChange("flow", val)}
          >
            {flows.map((fl) => {
              return (
                <Select.Option key={fl.id} value={fl.id}>
                  {fl.name}
                </Select.Option>
              );
            })}
          </Select>
        </div>
      </div>
      <div style={{ marginTop: 10 }}>
        <div>Description: </div>
        <div>
          <Input
            value={value.description}
            onChange={(ev) => onFieldChange("description", ev.target.value)}
          />
        </div>
      </div>
      {/* <div>
        <Button type="primary" onClick={onSaveClick}>
          Save
        </Button>
      </div> */}
    </div>
  );
};

export default Rule;
