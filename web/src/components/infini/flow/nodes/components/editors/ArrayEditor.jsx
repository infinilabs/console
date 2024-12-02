/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

import { Button, Input, Icon, Tooltip } from "antd";
import { getDefaultValue } from "../helper";
import { getBasicEditorMap, registBasicEditor } from "./registry";
import "./ArrayEditor.scss";
import { useCallback, useState } from "react";

const ArrayEditor = ({
  value = [],
  onChange,
  metadata = {},
  addButtonTooltip = "",
}) => {
  const [arrayValue, setArrayValue] = useState(value || []);
  const basicEditorMap = getBasicEditorMap();
  const { sub_type } = metadata;
  const EditorComponent = basicEditorMap[sub_type];
  if (!EditorComponent) {
    console.warn("can not find editor for ", sub_type);
    return null;
  }
  const innerValueChange = useCallback(
    (innerValue, i) => {
      setArrayValue((v) => {
        v[i] = innerValue;
        if (typeof onChange == "function") {
          onChange(v);
        }
        return [...v];
      });
    },
    [setArrayValue]
  );
  const onAddClick = useCallback(() => {
    const defaultValue = getDefaultValue(sub_type);
    setArrayValue((v) => {
      if (typeof onChange == "function") {
        onChange([...v, defaultValue]);
      }
      return [...v, defaultValue];
    });
  }, [setArrayValue]);

  const onRemoveClick = useCallback(
    (i) => {
      setArrayValue((v) => {
        v.splice(i, 1);
        if (typeof onChange == "function") {
          onChange(v);
        }
        return [...v];
      });
    },
    [setArrayValue]
  );

  return (
    <div className="array-editor">
      <div>
        <Tooltip title={addButtonTooltip || "add"}>
          <Button type="primary" size="small" onClick={onAddClick}>
            <Icon type="plus" />
          </Button>
        </Tooltip>
      </div>
      <div>
        {arrayValue.map((v, i) => {
          return (
            <div className="kv-line-w" key={i}>
              <EditorComponent
                value={v}
                onChange={(ivalue) => innerValueChange(ivalue, i)}
              />
              <div className="icon">
                <Button icon="delete" onClick={() => onRemoveClick(i)} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

registBasicEditor("array", ArrayEditor);
export default ArrayEditor;
