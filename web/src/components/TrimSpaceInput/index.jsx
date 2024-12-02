import { useState } from "react";
import { Input } from "antd";

const TrimSpaceInput = ({placeholder, onChange, value, ...restProps})=>{
  const [v, setV] = useState(value)
  const onValueChange = (ev)=>{
      let text = (ev.target.value || "").trim();
      setV(text)
      if(typeof onChange === "function"){
          onChange(text)
      }
  }
  return <Input placeholder={placeholder} value={v} onChange={onValueChange} {...restProps}/>
}

export default TrimSpaceInput;