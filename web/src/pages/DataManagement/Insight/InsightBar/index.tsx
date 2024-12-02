import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import SaveQueries from "../SaveQueries";
import LoadQueries from "../LoadQueries";
import InsightConfig, { ISearchConfig } from "../InsightConfig";
import styles from './index.less';
import { create, list, remove, update } from "../services/queries";
import FullScreen from "../FullScreen";
import ModeHandler from "../ModeHandler";
import { Icon, message } from "antd";
import SearchInfo from "../SearchInfo";
import ViewLayout from "../ViewLayout";

export interface IQueries {
  clusterId: string;
  indexPattern: any;
  query: any;
  timeField: string;
  timefilter: any;
  getFilters: () => any;
  getBucketSize: () => string;
  columns: string[];
}

export interface IRecord {
  id?: string;
  title: string;
  tags: string[];
  description?: string;
  author?: string;
  updated?: string;
  created?: string;
}

export interface IProps {
  queries: IQueries;
  loading: boolean;
  isEmpty: boolean;
  mode: string;
  onModeChange: (mode: string) => void;
  onQueriesSelect: (item: IRecord) => void;
  onQueriesRemove: (id: string) => void;
  onFullScreen: () => void;
  layoutConfig: {
    layout: any;
    onChange: (layout: any) => void;
  },
  getVisualizations: () => any[]
  searchInfo: any;
  selectedQueriesId: string;
  searchConfig: ISearchConfig;
  onSearchConfigChange: (value: any, name: string) => void;
  showLayoutListIcon: boolean;
  viewLayout: any;
  onViewLayoutChange: (layout: any) => void;
}

export default forwardRef((props: IProps, ref: any) => {
  const { 
    queries,
    loading: searchLoading,
    isEmpty,
    mode,
    onModeChange, 
    onFullScreen, 
    onQueriesSelect,
    onQueriesRemove,
    layoutConfig,
    getVisualizations,
    searchInfo,
    selectedQueriesId,
    searchConfig,
    onSearchConfigChange,
    showLayoutListIcon,
    viewLayout,
    onViewLayoutChange
  } = props;

  const {
    clusterId, 
    indexPattern, 
    query, 
    timeField, 
    timefilter, 
    getFilters, 
    getBucketSize,
    columns
  } = queries;

  const [record, setRecord] = useState<IRecord>();
  const [data, setData] = useState<IRecord[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const onSelect = (item: IRecord) => {
    setRecord(item)
    onQueriesSelect(item)
  };

  const onDelete =async (id: string) => {
    setLoading(true);
    await remove(id);
    if (record?.id === id) {
      setRecord(undefined)
    }
    onQueriesRemove(id)
    setLoading(false);
    fetchList(indexPattern.title, clusterId, 1500)
  };

  const onSave = async (newRecord: IRecord, callback?: () => void) => {
    setLoading(true)
    const { id, ...values } = newRecord;
    const action = id ? update : create;
    const filters = getFilters();
    const filter = {} as any;
    if (filters) filter.filters = filters;
    if (columns) filter.columns = columns;
    const body = { 
      ...(id ? newRecord : values), 
      cluster_id: clusterId,
      index_pattern: indexPattern.title,
      time_field: timeField,
      filter,
      query,
      time_filter: {
        from: timefilter.getTime().from,
        to: timefilter.getTime().to,
      },
      bucket_size: getBucketSize(),
      visualizations: getVisualizations()
    };
    const res = await action(body) as { _id: string, result: string }
    setRecord({ id: res._id,  ...newRecord })
    setLoading(false)
    if (callback) callback();
    fetchList(indexPattern.title, clusterId, 1500)
  }

  const fetchList = async (index: string, cluster: string, interval: number = 0) => {
    setLoading(true)
    setTimeout(async () => {
      const res = await list({ index_pattern: index, cluster_id: cluster}) as any;
      if (res?.hits?.hits) {
          const newData = res.hits.hits.map((item: any) => ({...item._source }));
          setData(newData);
          setTags(Array.from(new Set(newData.map((item: any) => item.tags || []).flat(Infinity))));
      }
      setLoading(false)
    }, interval)
  }

  const handleModeChange = (newMode: string) => {
    if (newMode === mode) {
      return;
    }
    if (isEmpty) return;
    if (!timeField) {
      message.warning('Please select a time field')
      return;
    }
    onModeChange(newMode)
  }

  useImperativeHandle(ref, () => ({
    loadQueries: (id: string) => data.find((item) => item.id === id)
  }));

  useEffect(() => {
    if (indexPattern.title && clusterId) {
      fetchList(indexPattern.title, clusterId)
    }
  }, [indexPattern.title, clusterId])

  useEffect(() => {
    if (selectedQueriesId) {
      const sq = data.find((item) => item.id === selectedQueriesId)
      if (sq) {
        onSelect(sq)
      }
    }
  }, [selectedQueriesId, JSON.stringify(data)]);

  return (
    <div className={styles.bar}>
      <SearchInfo {...searchInfo} loading={searchLoading}/>
      <SaveQueries
        tags={tags} 
        onTagsChange={setTags} 
        loading={loading} 
        record={record} 
        onQueriesSave={onSave}
        data={data}
      />
      <LoadQueries 
        tags={tags} 
        data={data} 
        loading={loading} 
        onSelect={onSelect} 
        onDelete={onDelete} 
      />
      { showLayoutListIcon && <ViewLayout layout={viewLayout} indexPattern={indexPattern} clusterId={clusterId} onChange={onViewLayoutChange}/> }
      {/* <Icon 
        type={"pie-chart"} 
        title={"Auto Insight"}
        onClick={() => handleModeChange('insight')}
      /> */}
      {/* <Icon 
        type={"table"} 
        title={"Normal Table"}
        onClick={() => handleModeChange("table")}
      /> */}
      { !isEmpty && mode !== "table" && <FullScreen onFullScreen={onFullScreen}/> }
      <InsightConfig 
        searchConfig={searchConfig}
        onSearchConfigChange={onSearchConfigChange}
        layoutConfig={layoutConfig}
      />
    </div>
  );
})
