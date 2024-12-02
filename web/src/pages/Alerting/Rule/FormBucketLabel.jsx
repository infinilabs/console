import {Form, Switch, Input} from "antd"
import { useState } from "react";

export default (props)=>{
  const { getFieldDecorator } = props.form;
  const i = props.alertObjectIndex || 0;
  const {initialValue} = props;
  const [labelEnabled, setLabelEnabled] = useState(
    initialValue?.enabled || false
  );
  return (
    <div>
      <Form.Item>
        {getFieldDecorator(`alert_objects[${i}][metrics][bucket_label][enabled]`, {
        initialValue: initialValue?.enabled || false,
        valuePropName: "checked",
      })(
        <Switch  onChange={(checked) => {
          setLabelEnabled(checked);
        }}/>
      )}
    </Form.Item>
     <Form.Item style={{display: labelEnabled? "block": "none"}}>
      {getFieldDecorator(`alert_objects[${i}][metrics][bucket_label][template]`, {
          initialValue: initialValue?.template || "",
        })(
          <Input.TextArea/>
        )}
      </Form.Item>
    </div>
  )
}