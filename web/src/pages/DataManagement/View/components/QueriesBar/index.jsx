import { Button, Select } from "antd";
import styles from "./index.less";
import { useEffect, useState } from "react";
import request from "@/utils/request";
import QueryStringInputUI from "@/components/vendor/data/public/ui/query_string_input/query_string_input";
import { withKibana } from "@/components/vendor/react/public";
import { ESPrefix } from "@/services/common";
// import { EuiSuperDatePicker } from "@/components/SuperDatePicker";
import { EuiSuperUpdateButton, EuiSuperDatePicker } from "@elastic/eui";
import { FilterBar } from "@/components/vendor/data/public/ui/filter_bar/filter_bar";
import { getContext } from "@/pages/DataManagement/context";
import { mergeFilters } from "./generate_filters";
import { mapAndFlattenFilters } from "@/components/vendor/data/public/query";
import DatePicker from "@/common/src/DatePicker";
import { getLocale } from "umi/locale";
import { getTimezone } from "@/utils/utils";

const QueryStringInput = withKibana(QueryStringInputUI);

const {
  intervalOptions,
  services,
  setIndexPatterns: setContextIndexPatterns,
} = getContext();

export default (props) => {
  const { clusterList, globalQueries = {}, onChange } = props;

  const [queries, setQueries] = useState(globalQueries);
  const [timeZone, setTimeZone] = useState(() => getTimezone());

  const {
    cluster_id,
    indices = [],
    time_field,
    range,
    kuery,
    filters = [],
  } = queries;

  const [indexPatterns, setIndexPatterns] = useState([]);

  const fetchIndexPatterns = async (cluster_id, indices) => {
    if (!indices || !cluster_id || indices.length === 0) {
      setIndexPatterns([]);
      return;
    }
    try {
      const { http } = getContext();
      http.getServerBasePath = () => {
        return `${ESPrefix}/` + cluster_id;
      };
      const promises = indices.map((item) =>
        services.indexPatternService.get(item, "index", cluster_id)
      );
      const res = await Promise.all(promises);
      if (res) {
        const newIndexPatterns = res
          .filter((item) => !!item)
          .map((item) => {
            item.timeFieldName = time_field;
            return item;
          });
        setIndexPatterns(newIndexPatterns);
      } else {
        setIndexPatterns([]);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const changeTimeField = (indexPatterns, time_field) => {
    setIndexPatterns(
      indexPatterns.map((item) => {
        item.timeFieldName = time_field;
        return item;
      })
    );
  };

  useEffect(() => {
    fetchIndexPatterns(cluster_id, indices);
  }, [cluster_id, JSON.stringify(indices)]);

  useEffect(() => {
    changeTimeField(indexPatterns, time_field);
  }, [JSON.stringify(indexPatterns), time_field]);

  useEffect(() => {
    setQueries(globalQueries);
  }, [JSON.stringify(globalQueries)]);

  useEffect(() => {
    indexPatterns.get = (id) => {
      return Promise.resolve(indexPatterns.find((ip) => ip.id == id));
    };
    setContextIndexPatterns(indexPatterns);
  }, [JSON.stringify(indexPatterns)]);

  return (
    <div className={styles.queriesBar}>
      <div className={styles.top}>
        <div className={styles.query}>
          <QueryStringInput
            disableAutoFocus
            indexPatterns={indexPatterns}
            query={
              kuery || {
                language: "kuery",
                query: "",
              }
            }
            onChange={(query) => {
              setQueries({
                ...queries,
                kuery: query,
              });
            }}
            services={services}
          />
        </div>
        <div className={styles.datePicker}>
          <DatePicker
            locale={getLocale()}
            start={range.from}
            end={range.to}
            onRangeChange={({ start, end }) => {
              setQueries({
                ...queries,
                range: {
                  ...range,
                  from: start,
                  to: end,
                },
              });
            }}
            isRefreshPaused={range.isPaused}
            refreshInterval={range.refreshInterval}
            onRefreshChange={({ isRefreshPaused, refreshInterval }) => {
              const newQueries = {
                ...queries,
                range: {
                  ...range,
                  refreshInterval,
                  isPaused: isRefreshPaused,
                },
              };
              if (queries.range.isPaused !== isRefreshPaused) {
                onChange(newQueries);
              } else {
                setQueries({
                  ...queries,
                  range: {
                    ...range,
                    refreshInterval,
                    isPaused: isRefreshPaused,
                  },
                });
              }
            }}
            timeZone={timeZone}
            onTimeZoneChange={setTimeZone}
            recentlyUsedRangesKey={"dashboard-search"}
          />
        </div>
        <div className={styles.refresh}>
          <EuiSuperUpdateButton
            needsUpdate={false}
            isDisabled={false}
            isLoading={false}
            onClick={() => {
              onChange(queries);
            }}
            className={styles.euiButtonRefresh}
          />
        </div>
      </div>
      <div className={styles.filters}>
        <FilterBar
          filters={filters}
          onFiltersUpdated={(newFilters) => {
            onChange({
              ...queries,
              filters: mapAndFlattenFilters(newFilters),
            });
          }}
          indexPatterns={indexPatterns}
          services={services}
        />
      </div>
    </div>
  );
};
