import { Icon } from "antd";
import { useMemo, useEffect, useState, useCallback } from "react";
import { formatMessage } from "umi/locale";
import SearchFacet from "./SearchFacet";
import styles from "./index.less";

export default (props) => {
  const { aggs, data, filters, onFacetChange, onReset } = props;

  const facets = useMemo(() => {
    const safeData = data && typeof data === "object" ? data : {};
    const fts = Object.keys(safeData).reduce((items, item) => {
      const agg = aggs?.[item];
      const field = agg?.field || agg?.terms?.field;
      if (!field) {
        return items;
      }
      items.push({
        label: agg?.label || item,
        field,
        buckets: safeData[item]?.buckets || [],
      });
      return items;
    }, []);
    return fts;
  }, [data, aggs]);

  return (
    <div className={styles.searchFilter}>
      <div className={styles.title}>
        <span>{formatMessage({ id: "listview.side.filter" })}</span>
        <span
          className={styles.reload}
          onClick={onReset}
          title={formatMessage({ id: "listview.side.filter.reset" })}
        >
          <Icon type="reload" style={{ color: "rgba(0, 127, 255, 1)" }} />
        </span>
      </div>
      <div className={styles.facetCnt}>
        {facets.map((ft) => {
          if (ft.buckets.length == 0) {
            return null;
          }
          return (
            <SearchFacet
              key={ft.field}
              label={ft.label}
              field={ft.field}
              data={ft.buckets}
              onChange={onFacetChange}
              selectedKeys={filters[ft.field] || []}
            />
          );
        })}
      </div>
    </div>
  );
};
