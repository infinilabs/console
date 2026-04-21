import { useState } from "react";
import { Form, Icon, TimePicker } from "antd";
import moment from "moment";
import styles from "./ExecuteIntervals.scss";

const IntervalItem = ({
  index,
  time,
  format,
  onCreate,
  onUpdate,
  onRemove,
  isLast,
}) => {
  const timePickerProps = {
    className: styles.timePicker,
    popupClassName: styles.timePickerPopup,
    allowClear: false,
    format,
    suffixIcon: <span></span>,
  };

  return (
    <div className={styles.executeIntervalItem}>
      <div key={index} className={styles.interval}>
        <Icon type="clock-circle" />
        <TimePicker
          placeholder="start time"
          value={time.start ? moment(time.start, format) : undefined}
          {...timePickerProps}
          onChange={(_, timeString) => {
            onUpdate(index, "start", timeString);
          }}
        />
        <span style={{ margin: "0 6px" }}>to</span>
        <TimePicker
          placeholder="end time"
          value={time.end ? moment(time.end, format) : undefined}
          {...timePickerProps}
          onChange={(_, timeString) => {
            onUpdate(index, "end", timeString);
          }}
        />
      </div>
      <div className={styles.actions}>
        {!isLast && (
          <Icon
            type="minus-circle"
            theme="filled"
            onClick={() => onRemove(index)}
          />
        )}
        {isLast && (
          <Icon type="plus-circle" theme="filled" onClick={onCreate} />
        )}
      </div>
    </div>
  );
};

const Intervals = ({ value = [], onChange, format }) => {

  const timePickerProps = {
    className: styles.timePicker,
    popupClassName: styles.timePickerPopup,
    allowClear: false,
    format,
    suffixIcon: <span></span>,
  };

  const onCreate = () => {
    const last = formatValue[formatValue.length - 1];
    if (last.start && last.end) {
      onChange([...formatValue, {
        start: '00:00',
        end: '23:59'
      }]);
    }
  };

  const onRemove = (index) => {
    const newValue = [...formatValue];
    newValue.splice(index, 1);
    onChange(newValue);
  };

  const onUpdate = (index, n, v) => {
    const newValue = [...formatValue];
    if (!newValue[index]) newValue[index] = {};
    newValue[index][n] = v;
    onChange(newValue);
  };

  const formatValue = value?.length === 0 ? [{}] : value;

  return (
    <>
      {formatValue.map((item, index) => {
        return (
          <IntervalItem
            key={index}
            index={index}
            time={item}
            format={format}
            onCreate={onCreate}
            onUpdate={onUpdate}
            onRemove={onRemove}
            isLast={index === formatValue.length - 1}
          />
        );
      })}
    </>
  );
};

export default ({ record, form }) => {
  const { getFieldDecorator } = form;

  const format = "HH:mm";

  return (
    <Form.Item label="Time Window">
      {getFieldDecorator("settings.execution.time_window", {
        initialValue: record?.settings?.execution?.time_window || [{ start: '00:00', end: '23:59' }],
        rules: [
          {
            required: true,
            message: "Please select execute start time!",
          },
          {
            validator: (rule, value, callback) => {
              if (!value || value.length === 0) {
                callback();
              } else {
                const isEmpty = value.some((item) => !item.start || !item.end);
                if (isEmpty) {
                  callback("Please select execute end time!");
                }
              }
              callback();
            },
          },
        ],
      })(<Intervals format={format}/>)}
    </Form.Item>
  );
};
