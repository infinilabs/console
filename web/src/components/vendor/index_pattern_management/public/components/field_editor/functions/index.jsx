import rate from './rate'
import rate_sum_func_value_in_group from './rate_sum_func_value_in_group'
import latency from './latency'
import latency_sum_func_value_in_group from './latency_sum_func_value_in_group'
import sum_func_value_in_group from './sum_func_value_in_group'

export const getStatistics = (type) => {
    if (type !== 'string') {
        return [
            "max",
            "min",
            "avg",
            "sum",
            "medium",
            "p99",
            "p95",
            "p90",
            "p80",
            "p50",
            "count",
            "cardinality",
          ];
    }
    return ["count",  "cardinality"];
};

const functions = {
    rate,
    rate_sum_func_value_in_group,
    latency,
    latency_sum_func_value_in_group,
    sum_func_value_in_group,
}

export default functions