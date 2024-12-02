import React, { useState, useCallback, useRef, useEffect } from "react";
import { Select, Input, Button, Icon, Dropdown, Menu } from "antd";
import "./ConditionEditor.scss";
import NetworkEditor from "./conditions/Network";
import InEditor from "./conditions/In";
import HasFeildsEditor from "./conditions/HasFields";
import RangeEditor from "./conditions/Range";

const getDropdownMenu = (onAddClick) => {
  return (
    <Menu onClick={onAddClick}>
      <Menu.Item key="equals">equals</Menu.Item>
      <Menu.Item key="contains">contains</Menu.Item>
      <Menu.Item key="regexp">regexp</Menu.Item>
      <Menu.Item key="range">range</Menu.Item>
      <Menu.Item key="network">network</Menu.Item>
      <Menu.Item key="has_fields">has_fields</Menu.Item>
      <Menu.Item key="in">in</Menu.Item>
      <Menu.Item key="queue_has_lag">queue_has_lag</Menu.Item>
      <Menu.Item key="cluster_available">cluster_available</Menu.Item>
      <Menu.Item key="or">or</Menu.Item>
      <Menu.Item key="and">and</Menu.Item>
      <Menu.Item key="not">not</Menu.Item>
    </Menu>
  );
};

const ConditionGroup = ({ value, onRemove, onChange }) => {
  const isCompositeCondition = React.useMemo(() => {
    if (!value) return false;
    return ["and", "or", "not"].includes(value.condition_type);
  }, [value]);

  const onChildRemove = useCallback(
    (rowId) => {
      const newConds = [...value.conditions];
      newConds.splice(rowId, 1);
      onChange({
        ...value,
        conditions: [...newConds],
      });
    },
    [value]
  );
  const onAddClick = useCallback(
    (ev) => {
      const { key: condition_type } = ev;
      let newCond = {
        condition_type,
        field: "",
        value: "",
        key: Date.now().valueOf(),
      };
      if (["and", "or", "not"].includes(condition_type)) {
        newCond = {
          condition_type,
          conditions: [],
          key: Date.now().valueOf(),
        };
      }
      onChange({
        ...value,
        conditions: [...value.conditions, newCond],
      });
    },
    [value]
  );
  const menu = getDropdownMenu(onAddClick);
  const handleChildChange = (v, i) => {
    value.conditions.splice(i, 1, v);
    onChange({
      ...value,
      conditions: [...value.conditions],
    });
  };

  if (!value) return null;
  const Editor = getEditor(value.condition_type);
  return (
    <div className="condition-group">
      {isCompositeCondition ? (
        <>
          <div style={{ marginBottom: 10, display: "flex" }}>
            <div>
              <Dropdown
                overlay={menu}
                overlayClassName="condition-type-dropdown"
              >
                <Button type="primary" size="small">
                  {value.condition_type}
                  <Icon type="plus" />
                </Button>
              </Dropdown>
            </div>
            <div>
              <Button icon="delete" size="small" onClick={onRemove} />
            </div>
          </div>
          {(value.conditions || []).map((cond, i) => {
            return (
              <ConditionGroup
                key={cond.key}
                value={cond}
                onChange={(v) => {
                  handleChildChange(v, i);
                }}
                onRemove={() => {
                  onChildRemove(i);
                }}
              />
            );
          })}
        </>
      ) : (
        <Editor value={value} onChange={onChange} onRemove={onRemove} />
      )}
    </div>
  );
};

const getEditor = (conditionType) => {
  switch (conditionType) {
    case "network":
      return NetworkEditor;
    case "in":
      return InEditor;
    case "has_fields":
      return HasFeildsEditor;
    case "cluster_available":
      return HasFeildsEditor;
    case "queue_has_lag":
      return HasFeildsEditor;
    case "range":
      return RangeEditor;
  }
  return CondRow;
};

const ConditionEditor = ({ label = "", onChange, value }) => {
  const onAddClick = (ev) => {
    const { key: condition_type } = ev;
    if (["and", "or", "not"].includes(condition_type)) {
      onChange({
        condition_type,
        conditions: [],
      });
      return;
    }
    onChange({
      condition_type,
      field: "",
      value: "",
    });
  };
  const menu = getDropdownMenu(onAddClick);
  const onRemove = () => {
    onChange(null);
  };
  return (
    <div className="condition-editor">
      <div>
        <div>{label}</div>
        {value == null ? (
          <div style={{ marginBottom: 10 }}>
            <div>
              <Dropdown
                overlay={menu}
                overlayClassName="condition-type-dropdown"
              >
                <Button type="primary" size="small">
                  <Icon type="plus" />
                </Button>
              </Dropdown>
            </div>
          </div>
        ) : (
          <ConditionGroup
            value={value}
            onChange={onChange}
            onRemove={onRemove}
          />
        )}
      </div>
    </div>
  );
};

export default ConditionEditor;

const CondRow = (props) => {
  // const basicEditorMap = getBasicEditorMap();
  const [value, setValue] = useState(props.value || {});
  let handleValueChange = (key, v) => {
    let newV = {
      ...value,
      [key]: v,
    };
    setValue(newV);
    props.onChange && props.onChange(newV);
  };
  return (
    <div style={{ marginBottom: 5 }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        {/* <div>{value.condition_type}</div> */}
        <Input.Group compact>
          <Input
            addonBefore={value.condition_type}
            placeholder="context field"
            value={value.field}
            style={{ width: "50%" }}
            onChange={(v) => {
              handleValueChange("field", v.target.value);
            }}
          />
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
            onClick={props.onRemove}
          />
        </Input.Group>
      </div>
    </div>
  );
};
