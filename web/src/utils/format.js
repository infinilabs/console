import numeral, { isNumeral } from "numeral";
import { timeFormatter, niceTimeFormatByDay } from "@elastic/charts";
import { DateTime } from "luxon";
import { getTimezone } from "@/utils/utils";

const unitArr = Array("B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB");
const tz = getTimezone();

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
  //将已格式化的字节value反格式化为原始字节数字
  bytesReverse: (value) => {
    value = value?.toUpperCase() || "";
    let srcsize = 0;
    for (let i = 0; i < unitArr.length; i++) {
      if (unitArr[i] == "B") {
        continue;
      }
      let indexOfVal = value.indexOf(unitArr[i]);
      if (indexOfVal > -1) {
        srcsize = value.substring(0, indexOfVal) * Math.pow(1024, i);
        break;
      }
    }
    if (srcsize == 0) {
      let indexOfVal = value.indexOf("B");
      if (indexOfVal > -1) {
        srcsize = value.substring(0, indexOfVal);
      }
    }
    return parseInt(srcsize);
  },
  dates: (day) => {
    let formatStr = niceTimeFormatByDay(day).replace(":ss", "");
    if (day == 7) {
      formatStr = formatStr.replace(":mm", "");
    }

    const formatter = timeFormatter(formatStr);

    return (v, options) => {
      options = options || {};
      options = {
        ...options,
        timeZone: tz,
      };
      return formatter(v, options);
    };
  },
  full_dates: (d) =>
    DateTime.fromMillis(d)
      .setZone(tz)
      .toFormat("yyyy-MM-dd HH:mm:ss"),
  utc_full_dates: (d) =>
    DateTime.fromMillis(d)
      .toUTC()
      .toFormat("yyyy-MM-dd HH:mm:ss"),
  ratio: (d) => `${Number(d).toFixed(0)}%`,
  highPrecisionNumber: (d) => numeral(d).format("0.0000"),
  lowPrecisionNumber: (d) => numeral(d).format("0.0"),
  number: (d) => numeral(d).format("0,0"),
  uptime: (val) => {
    let output = "";
    let years = Math.floor(val / (365 * 24 * 3600 * 1000));
    let days = Math.floor(val / (24 * 3600 * 1000));
    let leave1 = val % (24 * 3600 * 1000);
    let hours = Math.floor(leave1 / (3600 * 1000));
    let leave2 = leave1 % (3600 * 1000);
    let minutes = Math.floor(leave2 / (60 * 1000));

    if (years > 0) {
      output += years + "y ";
    } else if (days > 1) {
      output += days + "d ";
    } else if (days <= 1 && days > 0) {
      output += days + "d ";
      if (hours > 0) {
        output += hours + "h ";
      }
    } else if (hours > 0) {
      output += hours + "h ";
    } else {
      output += minutes + "m ";
    }
    return output;
  },
  uptimeToMilliseconds: (val) => {
    val = val ? val.toString() : "";
    let output = 0;
    let valNew = val.substr(0, val.length - 1);
    let unit = val.substr(val.length - 1, 1)?.toLowerCase();
    switch (unit) {
      case "y":
        output = valNew * 365 * 24 * 3600 * 1000; //Years
        break;
      case "d":
        output = valNew * 24 * 3600 * 1000; //Days
        break;
      case "h":
        output = valNew * 3600 * 1000; //Hours
        break;
      case "m":
        output = valNew * 60 * 1000; //Minutes
        break;
      case "s":
        output = valNew * 1000; //Seconds
        break;
      default:
        output = valNew;
    }

    return parseInt(valNew);
  },
  numberToHuman: (num) => {
    let output = "0";
    if (num < 1e4) {
      output = num;
    } else if (num >= 1e4 && num < 1e6) {
      output = (num / 1e3).toFixed(2) + "K"; //千
    } else if (num >= 1e6 && num < 1e9) {
      output = (num / 1e6).toFixed(2) + "M"; //百万
    } else if (num >= 1e9) {
      output = (num / 1e9).toFixed(2) + "B"; //十亿
    }
    return output;
  },
  dateUserDefined: (d, format = "yyyy-MM-dd HH:mm:ss") =>
    DateTime.fromMillis(d)
      .setZone(tz)
      .toFormat(format),
};

export function getFormatter(type, format, units) {
  switch (type) {
    case "bytes":
      return getBytesFormatter();
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

export function getBytesFormatter() {
  return (value) => formatter.bytes(value);
}
