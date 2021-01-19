import _ from 'lodash';

export const flattenObject = (nestedObj, flattenArrays) => {
    const stack = []; // track key stack
    const flatObj = {};
    const dot = '.';
    (function flattenObj(obj) {
        _.keys(obj).forEach(function (key) {
            stack.push(key);
            if (!flattenArrays && Array.isArray(obj[key])) flatObj[stack.join(dot)] = obj[key];
            else if (_.isObject(obj[key])) flattenObj(obj[key]);
            else flatObj[stack.join(dot)] = obj[key];
            stack.pop();
        });
    })(nestedObj);
    return flatObj;
};