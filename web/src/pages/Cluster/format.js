import numeral from "numeral";
import { timeFormatter, niceTimeFormatByDay } from "@elastic/charts";
import { DateTime } from "luxon";

const unitArr = Array("B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB");

export const formatter = {
  bytes: (value) => {
    if (isNaN(value) || null == value || value === "" || value == 0) {
      return "0B";
    }
    var index = 0;
    var srcsize = parseFloat(value);
    index = Math.floor(Math.log(srcsize) / Math.log(1024));
    var size = srcsize / Math.pow(1024, index);
    size = size.toFixed(1);
    return size + unitArr[index];
  },
  dates: (day) => {
    let formatStr = niceTimeFormatByDay(day).replace(":ss", "");
    if (day == 7) {
      formatStr = formatStr.replace(":mm", "");
    }
    return timeFormatter(formatStr);
  },
  full_dates: (d) => DateTime.fromMillis(d).toFormat("yyyy-MM-dd HH:mm:ss"),
  utc_full_dates: (d) =>
    DateTime.fromMillis(d)
      .toUTC()
      .toFormat("yyyy-MM-dd HH:mm:ss"),
  ratio: (d) => `${Number(d).toFixed(0)}%`,
  highPrecisionNumber: (d) => numeral(d).format("0.0000"),
  lowPrecisionNumber: (d) => numeral(d).format("0.0"),
  number: (d) => numeral(d).format("0,0"),
};

export function getFormatter(type, format, units) {
  switch (type) {
    case "bytes":
      return getBytesFormatter(units);
    case "ratio":
      return formatter.ratio;
    case "num":
      return getNumFormatter(format, units);
    default:
      return formatter.lowPrecisionNumber;
  }
}

export function getNumFormatter(format, units) {
  return (d) => numeral(d).format(format) + (units ? ` ${units}` : "");
}

export function getBytesFormatter(units) {
  return (value) => formatter.bytes(value) + (units ? `/${units}` : "");
}
