import { Input } from "antd";
import { useState } from "react";
import "./basiceditor.scss";

// const KeyValueEditor = ({ value = {}, onChange }) => {
//   const innerValueChange = (ev, field) => {
//     const innerValue = ev.target.value;
//     onChange({
//       ...value,
//       [field]: innerValue,
//     });
//   };
//   return (
//     <div className="keyvalue-editor">
//       <div className="kv-line">
//         <div className="kv-line-item" key="field">
//           <Input
//             addonBefore="Field"
//             value={value.field}
//             onChange={(ev) => innerValueChange(ev, "field")}
//           />
//         </div>
//         <div className="kv-line-item" key="value">
//           <Input
//             addonBefore="Value"
//             value={value.value}
//             onChange={(ev) => innerValueChange(ev, "value")}
//           />
//         </div>
//       </div>
//     </div>
//   );
// };

const KeyValueEditor = ({ value = "", onChange }) => {
  const [field, fv] = value.split("->");

  const editValue = {
    field: field.trim(),
    value: (fv || "").trim(),
  };
  const innerValueChange = (ev, field) => {
    const innerValue = ev.target.value;
    editValue[field] = innerValue;
    onChange(`${editValue["field"]} -> ${editValue["value"]}`);
  };
  return (
    <div className="keyvalue-editor">
      <div className="kv-line">
        <div className="kv-line-item" key="field">
          <Input
            addonBefore="Field"
            value={editValue.field}
            onChange={(ev) => innerValueChange(ev, "field")}
          />
        </div>
        <div className="kv-line-item" key="value">
          <Input
            addonBefore="Value"
            value={editValue.value}
            onChange={(ev) => innerValueChange(ev, "value")}
          />
        </div>
      </div>
    </div>
  );
};

export default KeyValueEditor;
