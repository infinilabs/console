import moment from "moment";
import momentTZ from "moment-timezone";
import React from "react";
import nzh from "nzh/cn";
import { parse, stringify } from "qs";
import wcmatch from "wildcard-match";
import { getLocale } from "umi/locale";

export function getWebsitePathByLang() {
  if (!APP_OFFICIAL_WEBSITE) return;
  if (getLocale() === "zh-CN") {
    return APP_OFFICIAL_WEBSITE.replace('.com', '.cn')
  } else {
    return APP_OFFICIAL_WEBSITE
  }
}

export function getDocPathByLang(product = 'console') {
  if (getLocale() === "zh-CN") {
    return `https://infinilabs.cn/docs/latest/${product}`
  } else {
    return `https://docs.infinilabs.com/${product}/main/docs`
  }
}

export function fixedZero(val) {
  return val * 1 < 10 ? `0${val}` : val;
}

const timezoneKey = "timezone";
export function getTimezone() {
  let zk = localStorage.getItem(timezoneKey);
  if (!zk) {
    zk = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimezone(zk);
  }
  return zk;
}
export function setTimezone(timezone) {
  localStorage.setItem(timezoneKey, timezone);
}

export function formatUtcTimeToLocal(val, format = "YYYY-MM-DD HH:mm:ss") {
  return momentTZ(val)
    .tz(getTimezone())
    .format(format);
}

export function getTimeDistance(type) {
  const now = new Date();
  const oneDay = 1000 * 60 * 60 * 24;

  if (type === "today") {
    now.setHours(0);
    now.setMinutes(0);
    now.setSeconds(0);
    return [moment(now), moment(now.getTime() + (oneDay - 1000))];
  }

  if (type === "week") {
    let day = now.getDay();
    now.setHours(0);
    now.setMinutes(0);
    now.setSeconds(0);

    if (day === 0) {
      day = 6;
    } else {
      day -= 1;
    }

    const beginTime = now.getTime() - day * oneDay;

    return [moment(beginTime), moment(beginTime + (7 * oneDay - 1000))];
  }

  if (type === "month") {
    const year = now.getFullYear();
    const month = now.getMonth();
    const nextDate = moment(now).add(1, "months");
    const nextYear = nextDate.year();
    const nextMonth = nextDate.month();

    return [
      moment(`${year}-${fixedZero(month + 1)}-01 00:00:00`),
      moment(
        moment(
          `${nextYear}-${fixedZero(nextMonth + 1)}-01 00:00:00`
        ).valueOf() - 1000
      ),
    ];
  }

  const year = now.getFullYear();
  return [moment(`${year}-01-01 00:00:00`), moment(`${year}-12-31 23:59:59`)];
}

export function getPlainNode(nodeList, parentPath = "") {
  const arr = [];
  nodeList.forEach((node) => {
    const item = node;
    item.path = `${parentPath}/${item.path || ""}`.replace(/\/+/g, "/");
    item.exact = true;
    if (item.children && !item.component) {
      arr.push(...getPlainNode(item.children, item.path));
    } else {
      if (item.children && item.component) {
        item.exact = false;
      }
      arr.push(item);
    }
  });
  return arr;
}

export function digitUppercase(n) {
  return nzh.toMoney(n);
}

function getRelation(str1, str2) {
  if (str1 === str2) {
    console.warn("Two path are equal!"); // eslint-disable-line
  }
  const arr1 = str1.split("/");
  const arr2 = str2.split("/");
  if (arr2.every((item, index) => item === arr1[index])) {
    return 1;
  }
  if (arr1.every((item, index) => item === arr2[index])) {
    return 2;
  }
  return 3;
}

function getRenderArr(routes) {
  let renderArr = [];
  renderArr.push(routes[0]);
  for (let i = 1; i < routes.length; i += 1) {
    // 去重
    renderArr = renderArr.filter((item) => getRelation(item, routes[i]) !== 1);
    // 是否包含
    const isAdd = renderArr.every((item) => getRelation(item, routes[i]) === 3);
    if (isAdd) {
      renderArr.push(routes[i]);
    }
  }
  return renderArr;
}

/**
 * Get router routing configuration
 * { path:{name,...param}}=>Array<{name,path ...param}>
 * @param {string} path
 * @param {routerData} routerData
 */
export function getRoutes(path, routerData) {
  let routes = Object.keys(routerData).filter(
    (routePath) => routePath.indexOf(path) === 0 && routePath !== path
  );
  // Replace path to '' eg. path='user' /user/name => name
  routes = routes.map((item) => item.replace(path, ""));
  // Get the route to be rendered to remove the deep rendering
  const renderArr = getRenderArr(routes);
  // Conversion and stitching parameters
  const renderRoutes = renderArr.map((item) => {
    const exact = !routes.some(
      (route) => route !== item && getRelation(route, item) === 1
    );
    return {
      exact,
      ...routerData[`${path}${item}`],
      key: `${path}${item}`,
      path: `${path}${item}`,
    };
  });
  return renderRoutes;
}

export function getPageQuery() {
  return parse(window.location.href.split("?")[1]);
}

export function getQueryPath(path = "", query = {}) {
  const search = stringify(query);
  if (search.length) {
    return `${path}?${search}`;
  }
  return path;
}

export function getUrlQuery(url) {
  return parse(url.split("?")[1]);
}

export function parseUrl(url) {
  let [arg1, arg2] = url.split("?");
  return { pathname: arg1, query: parse(arg2) };
}

export function isJSONString(val) {
  try {
    let obj = JSON.parse(val);
    if (typeof obj == "object" && obj) {
      return true;
    } else {
      // console.log("Incorrect JSON format:", val);
      return false;
    }
  } catch (e) {
    // console.log("JSON.parse error:", e, val);
    return false;
  }
}

/* eslint no-useless-escape:0 */
const reg = /(((^https?:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+(?::\d+)?|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)$/;

export function isUrl(path) {
  return reg.test(path);
}

export function isTLS(val) {
  return val?.toLowerCase()?.indexOf("https") == 0;
}

export function removeHttpSchema(val) {
  return val?.replace(/^https?:\/\//i, "");
}

export function addHttpSchema(val, isTLS = false) {
  let schema = isTLS ? "https" : "http";
  val = schema + "://" + removeHttpSchema(val);
  return val;
}

export function isFloat(val) {
  return typeof val == "number" && val != parseInt(val);
}

export function formatWan(val) {
  const v = val * 1;
  if (!v || Number.isNaN(v)) return "";

  let result = val;
  if (val > 10000) {
    result = Math.floor(val / 10000);
    result = (
      <span>
        {result}
        <span
          styles={{
            position: "relative",
            top: -2,
            fontSize: 14,
            fontStyle: "normal",
            lineHeight: 20,
            marginLeft: 2,
          }}
        >
          万
        </span>
      </span>
    );
  }
  return result;
}

export function isAntdPro() {
  return window.location.hostname === "preview.pro.ant.design";
}

/**
 * 大数字转换，将大额数字转换为万、千万、亿等
 *
 * @param value 数字值
 */
export function formatGigNumber(value) {
  const newValue = ["", "", ""];
  let fr = 1000;
  let num = 3;
  let text1 = "";
  let fm = 1;
  while (value / fr >= 1) {
    fr *= 10;
    num += 1;
    // console.log('数字', value / fr, 'num:', num)
  }
  if (num <= 4) {
    // 千
    newValue[0] = value + "";
    newValue[1] = "";
  } else if (num <= 8) {
    // 万
    fm = 10000;
    newValue[0] = parseFloat(value / fm).toFixed(2) + "";
    newValue[1] = "万";
  } else if (num <= 16) {
    // 亿
    text1 = (num - 8) / 3 > 1 ? "千亿" : "亿";
    text1 = (num - 8) / 4 > 1 ? "万亿" : text1;
    text1 = (num - 8) / 7 > 1 ? "千万亿" : text1;
    // tslint:disable-next-line:no-shadowed-variable
    fm = 1;
    if (text1 === "亿") {
      fm = 100000000;
    } else if (text1 === "千亿") {
      fm = 100000000000;
    } else if (text1 === "万亿") {
      fm = 1000000000000;
    } else if (text1 === "千万亿") {
      fm = 1000000000000000;
    }
    if (value % fm === 0) {
      newValue[0] = parseInt(value / fm) + "";
    } else {
      newValue[0] = parseFloat(value / fm).toFixed(2) + "";
    }
    newValue[1] = text1;
  }
  return newValue;
}

/**
 * 数组列表 关键词本地过滤
 *
 * @param {string} searchValue
 * @param {array} searchItems
 * @param {array} searchableFields
 * @returns
 */
export function filterSearchValue(
  searchValue,
  searchItems,
  searchableFields = []
) {
  if (!searchValue || !searchItems || searchValue == "*") {
    return searchItems || [];
  }
  return searchItems.filter((item) => {
    let searchableFieldsValues = [];
    if (searchableFields.length) {
      searchableFieldsValues = searchableFields.map((field) => {
        return item[field] ?? "";
      });
    } else {
      searchableFieldsValues = Object.values(searchItems);
    }

    return isMatch(searchValue, searchableFieldsValues.join(","));
  });
}

/**
 * 支持通配符查找
 *
 * @param {*} keyword
 * @param {*} sourceStr
 * @returns
 */
export function isMatch(keyword, sourceStr) {
  if (keyword == "*") {
    return true;
  }
  if (keyword.charAt(0) == "*") {
    keyword = keyword.substring(1, keyword.length - 1);
  }
  if (keyword.length - 1 == "*") {
    keyword = keyword.substring(0, keyword.length - 1);
  }
  return wcmatch("*" + keyword + "*")(sourceStr);
}

export const sorter = {
  string: (a, b, field) => {
    var stringA = a[field]?.toUpperCase(); // ignore upper and lowercase
    var stringB = b[field]?.toUpperCase(); // ignore upper and lowercase
    if (stringA < stringB) {
      return -1;
    }
    if (stringA > stringB) {
      return 1;
    }
    return 0;
  },
  num: (a, b, field) => {
    return a[field] - b[field];
  },
};

export const generateId = (size) => {
  let id = "";
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < size; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
};

export const distribution = {
  isElasticsearch: (val) => {
    return typeof val == "string" && val.toLowerCase() == "elasticsearch";
  },
  isOpensearch: (val) => {
    return typeof val == "string" && val.toLowerCase() == "opensearch";
  },
  isEasysearch: (val) => {
    return typeof val == "string" && val.toLowerCase() == "easysearch";
  },
};

export const isPc = () => {
  return window.screen.width >= 1200;
};

export const firstUpperCase = (val) => {
  if (val == "ok") {
    return val.toUpperCase();
  }
  if (typeof val === "string" && val.length > 0) {
    return val.charAt(0).toUpperCase() + val.slice(1);
  }
  return val;
};

export const formatToUniversalTime = (time, format, timezone) => {
  if (!time) return '-';
  return moment(time).tz(timezone || getTimezone()).format(format || "YYYY-MM-DD HH:mm:ss (G[M]TZ)")
}

export const generate20BitUUID = () => {
  let characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let uuid = characters[Math.floor(Math.random() * characters.length)];
  const buffer = new Uint8Array(9); 
  crypto.getRandomValues(buffer);
  for (let i = 0; i < buffer.length; i++) {
      uuid += buffer[i].toString(16).padStart(2, '0');
  }
  return uuid.slice(0, 20);
}
