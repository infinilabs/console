import { Button } from "antd";
import TagEditor from "@/components/infini/TagEditor";
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
    <div style={{ maxWidth: 300 }}>
      <div>Path</div>
      <div>
        <TagEditor value={value.path || []} onChange={onPathChange} />
      </div>
    </div>
  );
};
