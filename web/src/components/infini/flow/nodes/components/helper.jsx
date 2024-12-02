export const getDefaultValue = (type) => {
  let defaultValue;
  switch (type) {
    case "number":
      defaultValue = 0;
      break;
    case "date":
      defaultValue = moment();
      break;
    case "string":
      defaultValue = "";
      break;
    case "bool":
      defaultValue = false;
      break;
    case "enum":
      defaultValue = "";
      break;
    case "object":
      defaultValue = {};
      break;
    case "map":
      defaultValue = {};
      break;
    case "array":
      defaultValue = [];
      break;
    case "keyvalue":
      defaultValue = "";
      break;
    default:
      defaultValue = null;
  }
  return defaultValue;
};
