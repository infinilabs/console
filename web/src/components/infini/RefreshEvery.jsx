import { Select, InputNumber, Tooltip, Button } from "antd";
import { useRef, useState, useEffect } from "react";
import { formatMessage } from "umi/locale";
import styles from "./RefreshEvery.scss";

export default ({ start, onRefreshIntervalStart, onRefreshIntervalStop }) => {
  const [refreshSetting, setRefreshSetting] = useState({
    number: 5,
    unit: "s",
    start: start || false,
  });
  const intervalRef = useRef(null);

  useEffect(() => {
    if (refreshSetting.start) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      let interval = 0;
      if (refreshSetting.unit === "s") {
        interval = refreshSetting.number;
      } else if (refreshSetting.unit === "m") {
        interval = refreshSetting.number * 60;
      } else if (refreshSetting.unit === "h") {
        interval = refreshSetting.number * 60 * 60;
      }
      if (interval) {
        onRefreshIntervalStart();
        intervalRef.current = setInterval(() => {
          onRefreshIntervalStart();
        }, [interval * 1000]);
      }
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        onRefreshIntervalStop();
      }
    }
  }, [JSON.stringify(refreshSetting)]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setRefreshSetting({ ...refreshSetting, start });
  }, [start]);

  return (
    <div className={styles.refresh}>
      <span style={{ width: 60, textAlign: "center" }} className={styles.text}>
        {formatMessage({ id: "component.refreshGroup.label.every" })}
      </span>
      <InputNumber
        value={refreshSetting.number}
        style={{ width: 80 }}
        onChange={(value) => {
          setRefreshSetting({
            ...refreshSetting,
            number: value,
          });
        }}
      />
      <Select
        value={refreshSetting.unit}
        style={{ width: 100 }}
        onChange={(value) => {
          setRefreshSetting({
            ...refreshSetting,
            unit: value,
          });
        }}
      >
        <Select.Option value={"s"}>seconds</Select.Option>
        <Select.Option value={"m"}>minutes</Select.Option>
        <Select.Option value={"h"}>hours</Select.Option>
      </Select>
      <Button
        icon={refreshSetting.start ? "pause" : "caret-right"}
        onClick={() => {
          setRefreshSetting({
            ...refreshSetting,
            start: !refreshSetting.start,
          });
        }}
      >
        {refreshSetting.start
          ? formatMessage({ id: "form.button.stop" })
          : formatMessage({ id: "form.button.start" })}
      </Button>
    </div>
  );
};
