import { EuiToolTip, EuiSelect, EuiIconTip } from "@elastic/eui";
import { useOnClickOutside } from "@/lib/hooks/use_click_outsize";
import { useEffect, useState } from "react";
import { Input } from "antd";

export const SettingContent = ({
  onVisibleChange,
  bucketInterval = {},
  options = [],
  onChangeInterval,
  stateInterval,
  indexPattern,
  timeFields,
  onTimeFieldChange,
}) => {
  const [interval, setInterval] = useState(stateInterval);
  useEffect(() => {
    setInterval(stateInterval);
  }, [stateInterval]);

  const [settingRef] = useOnClickOutside(() => {
    if (typeof onVisibleChange == "function") {
      onVisibleChange(false);
    }
  });

  const handleIntervalChange = (e) => {
    setInterval(e.target.value);
    onChangeInterval(e.target.value);
  };

  return (
    <div className="dscSetting setting-content" ref={settingRef}>
      <div className="setting-wrapper">
        <div className="setting-row">
          <span className="label">Time Field</span>
          <div>
            <EuiSelect
              id="timefield"
              hasNoInitialSelection={true}
              value={indexPattern?.timeFieldName}
              options={timeFields.map((tf) => {
                return {
                  value: tf,
                  text: tf,
                };
              })}
              onChange={(e) => {
                onTimeFieldChange(indexPattern.id, e.target.value);
              }}
            />
          </div>
        </div>
        {indexPattern.timeFieldName ? (
          <div className="setting-row">
            <span className="label">Time Interval</span>
            <div>
              <EuiSelect
                aria-label={"Time interval"}
                compressed
                id="dscResultsIntervalSelector"
                options={options
                  .filter(({ val }) => val !== "custom")
                  .map(({ display, val }) => {
                    return {
                      text: display,
                      value: val,
                      label: display,
                    };
                  })}
                value={interval}
                onChange={handleIntervalChange}
                append={
                  bucketInterval.scaled ? (
                    <EuiIconTip
                      id="discoverIntervalIconTip"
                      content={`This interval creates ${
                        bucketInterval?.scale && bucketInterval?.scale > 1
                          ? "buckets that are too large"
                          : "too many buckets"
                      } to show in the selected time range, so it has been scaled to ${
                        bucketInterval.description
                      }.`}
                      color="warning"
                      size="s"
                      type="alert"
                    />
                  ) : (
                    undefined
                  )
                }
              />
            </div>
          </div>
        ) : null}
        {/* <div className="setting-row">
          <span className="label">Trace Field</span>
          <div>
            <Input key="trace_field" />
          </div>
        </div>
        <div className="setting-row">
          <span className="label">Trace Index</span>
          <div>
            <Input key="trace_index" />
          </div>
        </div> */}
      </div>
    </div>
  );
};
