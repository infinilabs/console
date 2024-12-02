import { Select } from "antd";
import { useCallback, useState } from "react"

export default (props={})=>{
  const [value, setValue] = useState();
  const onSearch = (value)=>{
    setValue(value);
    if(typeof props.onSearch === "function"){
      props.onSearch(value)
    }
  }
  const onBlur = (sv)=>{
    if(value){
      if(typeof props.onChange === "function"){
        props.onChange(value)
      }
    }
    if(typeof props.onBlur === "function"){
      props.onBlur(sv)
    }
  }
  
  return (
    <Select {...props} onSearch={onSearch} onBlur={onBlur}>
      {props.children}
    </Select>
  );
}