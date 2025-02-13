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
    if (range.from === range.to) {
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
