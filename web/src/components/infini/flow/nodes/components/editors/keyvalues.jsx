/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

import { Button, Input, Icon } from "antd";
import KeyValueEditor from "./keyvalue";

const KeyValuesEditor = ({ value = [], onChange }) => {
  const innerValueChange = (innerValue, i) => {
    value[i] = innerValue;
    onChange([...value]);
  };
  const onAddClick = () => {
    onChange([...value, { key: Date.now().valueOf() }]);
  };

  const onRemoveClick = (i) => {
    value.splice(i, 1);
    onChange([...value]);
  };

  return (
    <div className="keyvalues-editor">
      <div>
        <Button type="primary" size="small" onClick={onAddClick}>
          <Icon type="plus" />
        </Button>
      </div>
      <div>
        {value.map((v, i) => {
          return (
            <div
              className="kv-line-w"
              key={(v.key || Date.now().valueOf()) + i}
            >
              <KeyValueEditor
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

export default KeyValuesEditor;
