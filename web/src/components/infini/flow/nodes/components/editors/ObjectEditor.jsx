/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

import { Button, Input, Icon } from "antd";
import { getBasicEditorMap, registBasicEditor } from "./registry";
import "./ObjectEditor.scss";
import { useState } from "react";

const ObjectEditor = ({ value = {}, onChange, properties = {}, label }) => {
  const basicEditorMap = getBasicEditorMap();
  const onFieldValueChange = (field, fieldValue) => {
    onChange({
      ...value,
      [field]: fieldValue,
    });
  };

  return (
    <div className="object-editor">
      <div>{label}</div>
      <div className="wrapper">
        {Object.keys(properties).map((key) => {
          const { type } = properties[key];
          if (!type || !basicEditorMap[type]) {
            console.warn("can not find editor for type: ", type);
            return null;
          }
          const EditorComponent = basicEditorMap[type];
          return (
            <div key={key} className="field-line">
              <div className="label">{key}</div>
              <div>
                <EditorComponent
                  value={value[key] || properties[key]?.default_value}
                  onChange={(v) => {
                    onFieldValueChange(key, v);
                  }}
                  metadata={properties[key]}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

registBasicEditor("object", ObjectEditor);
export default ObjectEditor;
