import React, { useState, useMemo } from "react";
import { Card, Select } from "antd";
import { timezoneData } from "./timezoneData";
import { getTimezone, setTimezone } from "@/utils/utils";

const { Option } = Select;

export default (props) => {
  const [selectedTimezone, setSelectedTimezone] = useState(getTimezone());
  const onChange = (value) => {
    setSelectedTimezone(value);
    setTimezone(value);
    window.location.reload();
  };
  const [timezoneMap] = useMemo(() => {
    let map = {};
    timezoneData.map((item) => {
      map[item.value] = item;
    });

    return [map];
  }, [timezoneData]);
  return (
    <Card size="small" style={{ width: 500, height: 310 }}>
      <Select
        showSearch
        style={{ width: "100%" }}
        placeholder="Select a timezone"
        optionFilterProp="label"
        defaultValue={selectedTimezone}
        onChange={onChange}
      >
        {timezoneData.map((item, i) => {
          return (
            <Option
              key={i}
              value={item.value}
              label={`${item.value},${item.label},${item.altName}`}
            >
              {item.label}
            </Option>
          );
        })}
      </Select>
      <div
        style={{
          backgroundColor: "#efefef",
          marginTop: 10,
          padding: 10,
        }}
      >
        <p>
          <strong>Selected Timezone:</strong>
        </p>
        <pre>{JSON.stringify(timezoneMap[selectedTimezone], null, 2)}</pre>
      </div>
    </Card>
  );
};
