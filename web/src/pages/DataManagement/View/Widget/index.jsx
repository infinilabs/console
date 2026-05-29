import styles from "./index.less";
import { useEffect, useMemo, useRef, useState } from "react";
import { Drawer, Spin } from "antd";
import WidgetHeader from "./WidgetHeader";
import WidgetBody from "./WidgetBody";
import WidgetEmpty from "./WidgetEmpty";
import WidgetConfig from "./WidgetConfig";
import request from "@/utils/request";
import { formatESSearchResult } from "@/lib/elasticsearch/util";
import moment from "moment";
import { formatMessage } from "umi/locale";
import { stringify } from "qs";
import Mark from "@/components/Icons/Mark";
import SelectAndZoom from "@/components/Icons/SelectAndZoom";
import Fork from "@/components/Icons/Fork";
import { TYPE_DATA_DRILLING, TYPE_FIELD_FILTER, TYPE_HIGHLIGHT_MARK, TYPE_RANGE_FILTER } from "../components/ContextMenu";
import { mergeFilters } from "../components/QueriesBar/generate_filters";
import WidgetConfigDrawer from "./WidgetConfig/WidgetConfigDrawer";
import { cloneDeep } from "lodash";

export default (props) => {
  const { 
    isEdit, 
    isFullElement, 
    record, 
    globalQueries,
    onGlobalQueriesChange, 
    defaultQueries, 
    clusterList, 
    searchData, 
    onClone,
    onRemove, 
    onEdit, 
    onSave, 
    refresh, 
    onFullElement,
    globalRangeCache,
    onGlobalRangeCacheChange,
    highlightRange,
    onHighlightRangeChange, 
    queriesBarParams,
    isFullScreen,
    hideHeader,
    displayOptions={},
    onResultChange,
    lockInteractions,
    autoApplyRangeFilter,
  } = props;

  const [cacheRecord, setCacheRecord] = useState(record)

  const { id, series = [], drilling = {} } = cacheRecord

  const { type, queries = {} } = series[0] || {}

  const [visible, setVisible] = useState(false);

  const [data, setData] = useState([])

  const [zoom, setZoom] = useState(0);

  const zoomCacheRef = useRef([]);

  const [loading, setLoading] = useState(false);

  const [isChanged, setIsChanged] = useState(false)

  const fetchParamsCacheRef = useRef({});

  const handleClone = (record) => {
    onClone(record);
  }

  const handleRemove = (record) => {
    onRemove(record);
  }

  const handleEdit = () => {
    setVisible(true)
  }

  const handleSave = (record) => {
    onSave(record)
    setVisible(false)
  }

  const onZoomCacheUpdate = (zoomCache) => {
    zoomCacheRef.current = zoomCache;
  }

  const onCacheRecordChange = (record) => {
    setIsChanged(true);
    setCacheRecord(record)
  }

  const onRecordReset = () => {
    setIsChanged(false);
    onGlobalRangeCacheChange()
    setZoom(0)
    onZoomCacheUpdate([])
    onHighlightRangeChange()
    setCacheRecord(record)
  }

  const parseBucketSize = (bucketSize) => {
    const matched = `${bucketSize || ""}`.trim().match(/^(\d+)(ms|s|m|h|d|w|M|y)$/);
    if (!matched) {
      return null;
    }
    const value = parseInt(matched[1], 10);
    if (!Number.isInteger(value) || value <= 0) {
      return null;
    }
    return {
      value,
      unit: matched[2],
    };
  }

  const getMomentAddUnit = (unit) => {
    const unitMap = {
      ms: "milliseconds",
      s: "seconds",
      m: "minutes",
      h: "hours",
      d: "days",
      w: "weeks",
      M: "months",
      y: "years",
    };
    return unitMap[unit];
  }

  const floorMomentToBucket = (value, bucketSize) => {
    const parsedBucket = parseBucketSize(bucketSize);
    const currentMoment = moment(value);
    if (!parsedBucket || !currentMoment.isValid()) {
      return null;
    }
    const { value: bucketValue, unit } = parsedBucket;
    switch (unit) {
      case "ms":
        return currentMoment.clone();
      case "s":
        return currentMoment.clone().milliseconds(0).seconds(
          Math.floor(currentMoment.seconds() / bucketValue) * bucketValue
        );
      case "m":
        return currentMoment
          .clone()
          .startOf("hour")
          .add(Math.floor(currentMoment.minutes() / bucketValue) * bucketValue, "minutes");
      case "h":
        return currentMoment
          .clone()
          .startOf("day")
          .add(Math.floor(currentMoment.hours() / bucketValue) * bucketValue, "hours");
      case "d":
        return currentMoment
          .clone()
          .startOf("month")
          .add(Math.floor((currentMoment.date() - 1) / bucketValue) * bucketValue, "days");
      case "w": {
        const baseMoment = moment(0).startOf("week");
        const diff = currentMoment.clone().startOf("week").diff(baseMoment, "weeks");
        return baseMoment.clone().add(Math.floor(diff / bucketValue) * bucketValue, "weeks");
      }
      case "M":
        return currentMoment
          .clone()
          .startOf("year")
          .add(Math.floor(currentMoment.month() / bucketValue) * bucketValue, "months");
      case "y": {
        const baseMoment = moment(0).startOf("year");
        const diff = currentMoment.clone().startOf("year").diff(baseMoment, "years");
        return baseMoment.clone().add(Math.floor(diff / bucketValue) * bucketValue, "years");
      }
      default:
        return null;
    }
  }

  const ceilMomentToBucket = (value, bucketSize) => {
    const parsedBucket = parseBucketSize(bucketSize);
    const currentMoment = moment(value);
    const flooredMoment = floorMomentToBucket(value, bucketSize);
    if (!parsedBucket || !currentMoment.isValid() || !flooredMoment) {
      return null;
    }
    if (currentMoment.valueOf() === flooredMoment.valueOf()) {
      return flooredMoment.clone();
    }
    return flooredMoment.clone().add(parsedBucket.value, getMomentAddUnit(parsedBucket.unit));
  }

  const alignRangeToBucket = (range, bucketSize) => {
    const parsedBucket = parseBucketSize(bucketSize);
    if (!parsedBucket || !range?.from || !range?.to) {
      return null;
    }
    const startMoment = floorMomentToBucket(range.from, bucketSize);
    let endMoment = ceilMomentToBucket(range.to, bucketSize);
    const rawEndMoment = moment(range.to);
    if (!startMoment || !endMoment) {
      return null;
    }
    if (
      endMoment.valueOf() === startMoment.valueOf() ||
      (rawEndMoment.isValid() && endMoment.valueOf() === rawEndMoment.valueOf())
    ) {
      endMoment = endMoment.clone().add(parsedBucket.value, getMomentAddUnit(parsedBucket.unit));
    }
    return {
      from: startMoment.toISOString(),
      to: endMoment.clone().subtract(1, "millisecond").toISOString(),
    };
  }

  const handleZoom = (newZoom) => {
    if (newZoom === 0) {
      setZoom(newZoom)
      onZoomCacheUpdate([])
      setIsChanged(false)
      return;
    }
    const lastCache = zoomCacheRef.current[newZoom - 1];
    const { dataCache, rangeCache } = lastCache
    if (dataCache.length < 10) return;
    setZoom(newZoom)
    setIsChanged(true)
  }

  const handleContextMenu = (params, type) => {
    if (type === TYPE_HIGHLIGHT_MARK) {
      handleHighlightMark(params)
      return;
    }
    if (type === TYPE_RANGE_FILTER) {
      handleRangeFilter(params)
      return;
    }
    if (type === TYPE_FIELD_FILTER) {
      handleFieldFilter(params)
      return;
    }
    if (type === TYPE_DATA_DRILLING) {
      handleDataDrilling(params)
      return;
    }
  }

  const handleHighlightMark = (params) => {
    if (!params || !params.range) return;
    const { range } = params;
    setIsChanged(true)
    onHighlightRangeChange(range)
  }

  const handleRangeFilter = (params) => {
    if (!params || !params.range) return;
    const { range } = params;
    let newRange = {};
    const alignedRange = alignRangeToBucket(range, fetchParamsCacheRef.current?.bucketSize);
    if (alignedRange) {
      newRange = alignedRange;
    } else if (range.from === range.to) {
      if (fetchParamsCacheRef.current?.bucketSize) {
        let value = parseInt(fetchParamsCacheRef.current?.bucketSize)   
        let unit = (fetchParamsCacheRef.current?.bucketSize).replace(/\d+/gi,"") 
        if (unit === 'ms') {
          value = 1;
          unit = 's';
        }
        newRange = {
          from: moment(range.from).subtract(value, unit).toISOString(),
          to: moment(range.from).add(value, unit).toISOString()
        }
      }
    } else {
      newRange = {
        from: moment(range.from).toISOString(),
        to: moment(range.to).toISOString()
      }
    }
    onGlobalQueriesChange({
      ...globalQueries,
      range:  {
        ...globalQueries.range,
        ...newRange
      }
    })
    setZoom(0)
    onZoomCacheUpdate([])
  }

  const handleFieldFilter = (params) => {
    const { filters = [] } = params;
    const { filters: globalFilters = [] } = globalQueries;
    onGlobalQueriesChange({ ...globalQueries, filters: mergeFilters(globalFilters, filters) })
  }

  const handleDataDrilling = (params) => {
    if (drilling.url) {
      window.open(
        `${drilling.url}${drilling.url.indexOf("?") > -1 ? '&' : ''}${stringify(params)}`, 
        drilling.new_tab_switch ? '_blank' : '_self'
      )
    }
  }

  const handleLayerChange = (groupIndex) => {
    const newRecord = cloneDeep(cacheRecord)
    newRecord.layer_index = groupIndex;
    setCacheRecord(newRecord)
  }

  useEffect(() => {
    setCacheRecord(record)
  }, [JSON.stringify(record)])

  useEffect(() => {
      if (isEdit) {
        setCacheRecord(record)
      }
  }, [isEdit])

  useEffect(() => {
    if (!globalRangeCache) {
      setIsChanged(false)
    }
  }, [JSON.stringify(globalRangeCache)])

  return (
    <div className={styles.widget} style={{ border: displayOptions.hideBorder ? '0px' : '1px solid rgb(187, 187, 187)'}}>
      <Spin spinning={loading}>
        {
          !displayOptions.hideHeader && (
            <WidgetHeader 
              record={cacheRecord}
              isChanged={isChanged}
              onRecordChange={onCacheRecordChange}  
              onRecordReset={onRecordReset}
              globalQueries={globalQueries}
              isEdit={isEdit}
              isFullElement={isFullElement}
              handleFullElement={() => onFullElement(record)}
              zoom={zoom}
              handleZoom={handleZoom}
              handleEdit={handleEdit}
              handleClone={handleClone}
              handleRemove={handleRemove}
              isFullScreen={isFullScreen} 
              handleLayerChange={handleLayerChange}
            />
          )
        }
        <WidgetBody 
          record={cacheRecord}
          onRecordChange={onCacheRecordChange} 
          onRecordReset={onRecordReset}
          isEdit={isEdit}
          globalQueries={globalQueries} 
          refresh={refresh}
          globalRangeCache={globalRangeCache}
          zoom={zoom}
          loading={loading}
          setLoading={setLoading}
          zoomCache={zoomCacheRef.current}
          onZoomCacheUpdate={onZoomCacheUpdate}
          highlightRange={highlightRange}
          fetchParamsCache={fetchParamsCacheRef}
          queriesBarParams={queriesBarParams}
          handleContextMenu={handleContextMenu}
          isFullScreen={isFullScreen}
          lockInteractions={lockInteractions}
          autoApplyRangeFilter={autoApplyRangeFilter}
          onResultChange={onResultChange} 
        />
      </Spin>
      <WidgetConfigDrawer 
        visible={visible}
        onVisibleChange={setVisible}
        record={record}
        globalQueries={globalQueries}
        clusterList={clusterList}
        onSave={handleSave}
      />
    </div>
  );
};
