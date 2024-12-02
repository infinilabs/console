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
    return {
      size,
      unit: unitArr[index],
    };
  },
};
