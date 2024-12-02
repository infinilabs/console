export const formatConfigsValues = (configs) => {
  const configs_new = {};
  Object.keys(configs).map((k) => {
    let item = configs[k];
    item.interval = item?.interval
      ? item.interval.toString().replace(/s/g, "")
      : 10;
    configs_new[k] = {
      ...item,
      interval: `${item.interval}s`,
    };
  });
  return configs_new;
};
