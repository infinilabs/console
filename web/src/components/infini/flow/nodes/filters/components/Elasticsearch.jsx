import { Button, Input } from "antd";
import { useCallback, useState } from "react";
export default ({ value, onChange }) => {
  const onPropertieChange = (property, ev) => {
    const { value: pvalue } = ev.target;
    onChange({
      ...value,
      [property]: pvalue,
    });
  };
  return (
    <div>
      <div>Elasticsearch</div>
      <div>
        <Input
          value={value.elasticsearch}
          onChange={(ev) => onPropertieChange("elasticsearch", ev)}
        />
      </div>
    </div>
  );
};
