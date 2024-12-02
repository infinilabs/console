import { Button } from "antd";
import KeyValuesEditor from "../../components/editors/keyvalues";
import { useCallback, useState } from "react";
export default ({ value, onChange }) => {
  const onPathChange = useCallback(
    (path) => {
      onChange({
        ...value,
        path,
      });
    },
    [onChange, value]
  );
  return (
    <div>
      <div>Path</div>
      <div>
        <KeyValuesEditor value={value.path || []} onChange={onPathChange} />
      </div>
    </div>
  );
};
