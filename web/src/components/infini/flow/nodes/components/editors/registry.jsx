import { InputNumber, DatePicker, Input, Switch, Select } from "antd";
import StringEditor from "./string";
import EnumEditor from "./enum";
import BoolEditor from "./bool";
import moment from "moment";
import KeyValueEditor from "./keyvalue";

import { memo } from "react";

const basicEditorMap = {
  number: InputNumber,
  date: DatePicker,
  string: StringEditor,
  bool: BoolEditor,
  enum: EnumEditor,
  keyvalue: memo(KeyValueEditor),
};

export const registBasicEditor = (type, Component) => {
  basicEditorMap[type] = Component;
};

export const getBasicEditorMap = () => {
  return basicEditorMap;
};
