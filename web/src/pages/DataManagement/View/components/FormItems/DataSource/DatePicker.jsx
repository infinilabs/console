import { EuiSuperDatePicker } from "@elastic/eui"
import DatePicker from "@/common/src/DatePicker";
import { getLocale } from "umi/locale";
import { useState } from "react";
import { getTimezone } from "@/utils/utils";

export default (props) => {

    const { value = {}, onChange } = props;
    const [timeZone, setTimeZone] = useState(() => getTimezone());

    return (
      <DatePicker
        locale={getLocale()}
        start={value.from}
        end={value.to}
        onRangeChange={({start, end}) => {
            onChange({
                ...value,
                from: start,
                to: end
            })
        }}
        isRefreshPaused={value.isPaused}
        refreshInterval={value.refreshInterval}
        onRefreshChange={({ isRefreshPaused, refreshInterval }) => {
            onChange({
                ...value,
                refreshInterval,
                isPaused: isRefreshPaused
            })
        }}
        timeZone={timeZone}
        onTimeZoneChange={setTimeZone}
        recentlyUsedRangesKey={'dashboard-config'}
    />
    )
}