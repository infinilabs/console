import { Button, Input, Select, Icon } from "antd";
import { useEffect, useMemo, useState } from "react";
const InputGroup = Input.Group;
const Option = Select.Option;

const ApiPrivilegeField = ({ value = [], onChange, options }) => {
  const [innerValue, setInnerValue] = useState(value);
  const onInnerValueChange = (val, i) => {
    setInnerValue(st=>{
      const newVal = [...st];
      if (st[i]._key) {
        val._key = st[i]._key;
      }
  
      newVal[i] = val;
      if (typeof onChange == "function") {
        onChange(newVal);
      }
      return newVal;
    })
   
  };
  const onAddClick = () => {
    const newVal = [...value, { _key: new Date().valueOf() }];
    setInnerValue(newVal);
    if (typeof onChange == "function") {
      onChange(newVal);
    }
  };

  const apiPrivilegeEl = useMemo(()=>{
    const onRemoveClick = (i) => {
      setInnerValue(st=>{
        const newVal = [...st];
        newVal.splice(i, 1);
        if (typeof onChange == "function") {
          onChange(newVal);
        }
        return newVal;
      });
     
    };
    return innerValue.map((item, i) => {
      return (
        <div
          key={item._key || JSON.stringify(item)}
          style={{ display: "flex", alignItems: "center" }}
        >
          <ApiPrivilegeItem
            value={item}
            options={options}
            onChange={(val) => {
              onInnerValueChange(val, i);
            }}
          />
          <div style={{ marginLeft: 10 }}>
            <Icon
              type="close-circle"
              onClick={() => onRemoveClick(i)}
              style={{ fontSize: 18, cursor: "pointer" }}
            />
          </div>
        </div>
      );
    })
  }, [options, innerValue.length])

  return (
    <div>
      <div
        style={{
          display: "flex",
          color: "#999",
          lineHeight: "1.4em",
          marginTop: 10,
        }}
      >
        <div style={{ width: "20%" }}>Category</div>
        <div style={{ width: "80%" }}>Privilege</div>
      </div>
      {apiPrivilegeEl}
      <Button icon="plus" type="primary" onClick={onAddClick}>
        Add
      </Button>
    </div>
  );
};

export default ApiPrivilegeField;

const ApiPrivilegeItem = ({ options = {}, value = {}, onChange }) => {
  const [itemValue, setItemValue] = useState(value)
  const cates = Object.keys(options);
  const kvs = Object.entries(itemValue).filter((kv) => kv[0] != "_key");
  let innerCate = "";
  let innerValue = [];
  if (kvs.length > 0) {
    innerCate = kvs[0][0];
    innerValue = kvs[0][1];
  }
  let allPrivileges = [];
  if (innerCate && options[innerCate]) {
    allPrivileges = options[innerCate];
  }

  const [privileges, setPrivileges] = useState(innerValue);
  const onInnerCateChange = (val) => {
    const newVal = {
      [val]: [],
    };
    setItemValue(newVal);
    if (typeof onChange == "function") {
      onChange(newVal);
      setPrivileges([]);
    }
  };
  const onInnerValueChange = (val) => {
    const newVal = {
      [innerCate]: val,
    };
    setItemValue(newVal);
    if (typeof onChange == "function") {
      onChange(newVal);
    }
    setPrivileges(val);
  };

  return (
    <div style={{ flex: "1 1 auto" }}>
      <InputGroup compact>
        <Select
          style={{ width: "20%" }}
          defaultValue={innerCate}
          onChange={onInnerCateChange}
        >
          {cates.map((cate) => (
            <Option value={cate} key={cate}>
              {cate}
            </Option>
          ))}
        </Select>
        <Select
          style={{ width: "80%" }}
          mode="tags"
          // defaultValue={innerValue}
          value={privileges}
          onChange={onInnerValueChange}
        >
          {allPrivileges.map((pv) => (
            <Option value={pv} key={pv}>
              {pv}
            </Option>
          ))}
        </Select>
      </InputGroup>
    </div>
  );
};
