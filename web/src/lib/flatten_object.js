import _ from "lodash";

export const flattenObject = (nestedObj, flattenArrays) => {
  const stack = []; // track key stack
  const flatObj = {};
  const dot = ".";
  (function flattenObj(obj) {
    _.keys(obj).forEach(function(key) {
      stack.push(key);
      if (!flattenArrays && Array.isArray(obj[key]))
        flatObj[stack.join(dot)] = obj[key];
      else if (_.isObject(obj[key])) flattenObj(obj[key]);
      else flatObj[stack.join(dot)] = obj[key];
      stack.pop();
    });
  })(nestedObj);
  return flatObj;
};

export const unflattenObject = (obj, sep = ".") => {
  let output = {};
  Object.keys(obj).forEach((key) => {
    if (key.indexOf(sep) !== -1) {
      const keyArr = key.split(".").filter((item) => item !== "");
      let currObj = output;
      keyArr.forEach((k, i) => {
        if (typeof currObj[k] === "undefined") {
          if (i === keyArr.length - 1) {
            currObj[k] = obj[key];
          } else {
            currObj[k] = isNaN(keyArr[i + 1]) ? {} : [];
          }
        }
        currObj = currObj[k];
      });
    } else {
      output[key] = obj[key];
    }
  });
  return output;
};
