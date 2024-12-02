export const encodeProxyPath = (path, queryParams = {}) => {
  const queryStr = Object.entries(queryParams)
    .map((kvs) => kvs.join("="))
    .join("&");
  return encodeURIComponent(`${path}?${queryStr}`);
};

export const abbreviate = (dotText, targetLength) => {
  var buf = {
    str: "",
    toString: function () {
      return this.str;
    },
  };
  var inLen = dotText.length;
  if (inLen < targetLength) {
    return dotText;
  }
  var dotIndexesArray = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  var lengthArray = (function (s) {
    var a = [];
    while (s-- > 0) a.push(0);
    return a;
  })(10 + 1);
  var dotCount = computeDotIndexes(dotText, dotIndexesArray);
  if (dotCount === 0) {
    return dotText;
  }
  computeLengthArray(dotText, dotIndexesArray, lengthArray, dotCount, targetLength);
  for (var i = 0; i <= dotCount; i++) {
    if (i === 0) {
      buf.str += dotText.substring(0, lengthArray[i] - 1);
    } else {
      buf.str += dotText.substring(
        dotIndexesArray[i - 1],
        dotIndexesArray[i - 1] + lengthArray[i]
      );
    }
  }
  return buf.str;
};

const computeDotIndexes = (dotText, dotArray) => {
    var dotCount = 0;
    var k = 0;
    while (true) {
      k = dotText.indexOf('.', k);
      if (k !== -1 && dotCount < 10) {
          dotArray[dotCount] = k;
          dotCount++;
          k++;
      }
      else {
          break;
      }
    }
    return dotCount;
};

const computeLengthArray = function (dotText, dotArray, lengthArray, dotCount, targetLength) {
    var toTrim = dotText.length - targetLength;
    var len;
    for (var i = 0; i < dotCount; i++) {
      var previousDotPosition = (i === 0) ? -1 : dotArray[i - 1];
      var charactersInSegment = dotArray[i] - previousDotPosition - 1;
      if (toTrim > 0) {
          len = (charactersInSegment < 1) ? charactersInSegment : 1;
      }
      else {
          len = charactersInSegment;
      }
      toTrim -= (charactersInSegment - len);
      lengthArray[i] = len + 1;
    }
    var lastDotIndex = dotCount - 1;
    lengthArray[dotCount] = dotText.length - dotArray[lastDotIndex];
};