import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import SaveQueries from "../SaveQueries";
import LoadQueries from "../LoadQueries";
import InsightConfig, { ISearchConfig } from "../InsightConfig";
import styles from './index.less';
import { create, list, remove, update } from "../services/queries";
import FullScreen from "../FullScreen";
import { Icon, message } from "antd";
import SearchInfo from "../SearchInfo";
import Histogram from "../Histogram";
import ViewLayout from "../ViewLayout";
import { formatMessage } from "umi/locale";

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
  exportHits?: any[];
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
  getShareUrl?: () => string;
}

const normalizeExportValue = (value: any) => {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
};

const escapeCSVValue = (value: any) => {
  const text = normalizeExportValue(value);
  return `"${text.replace(/"/g, '""')}"`;
};

const escapeHTML = (value: any) => {
  return normalizeExportValue(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
};

const sanitizeFileName = (value: string) => {
  return (value || "insight")
    .replace(/[\\/:*?"<>|]+/g, "_")
    .replace(/\s+/g, "_");
};

const copyText = async (text: string) => {
  if (!text) {
    return false;
  }
  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  const input = document.createElement("textarea");
  input.value = text;
  input.setAttribute("readonly", "readonly");
  input.style.position = "fixed";
  input.style.top = "-9999px";
  document.body.appendChild(input);
  input.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(input);
  return copied;
};

export default forwardRef((props: IProps, ref: any) => {
  const { 
    queries,
    exportHits = [],
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
    onViewLayoutChange,
    histogramProps = {},
    getShareUrl,
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

  const getFlattenedHit = (hit: any) => {
    if (indexPattern?.flattenHit) {
      return indexPattern.flattenHit(hit, true) || {};
    }
    return hit?._source || {};
  };

  const getExportColumns = () => {
    const visibleColumns = (columns || []).filter((item) => item);
    if (visibleColumns.length > 0 && !visibleColumns.includes("_source")) {
      return visibleColumns;
    }
    const fieldSet = new Set<string>();
    exportHits.forEach((hit) => {
      Object.keys(getFlattenedHit(hit)).forEach((field) => {
        fieldSet.add(field);
      });
    });
    return Array.from(fieldSet);
  };

  const downloadFile = (content: string, type: string, extension: string) => {
    const baseName = sanitizeFileName(indexPattern?.title || "insight");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const blob = new Blob(["\ufeff", content], { type });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${baseName}-${timestamp}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleExport = (type: "csv" | "excel") => {
    if (!exportHits || exportHits.length === 0) {
      message.warning(formatMessage({ id: "insight.export.empty" }));
      return;
    }

    const exportColumns = getExportColumns();
    if (exportColumns.length === 0) {
      message.warning(formatMessage({ id: "insight.export.empty" }));
      return;
    }

    const rows = exportHits.map((hit) => {
      const flattened = getFlattenedHit(hit);
      return exportColumns.map((field) => flattened[field]);
    });

    if (type === "csv") {
      const content = [
        exportColumns.map(escapeCSVValue).join(","),
        ...rows.map((row) => row.map(escapeCSVValue).join(",")),
      ].join("\n");
      downloadFile(content, "text/csv;charset=utf-8;", "csv");
      return;
    }

    const content = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="UTF-8" />
        </head>
        <body>
          <table>
            <thead>
              <tr>${exportColumns.map((field) => `<th>${escapeHTML(field)}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${rows
                .map(
                  (row) =>
                    `<tr>${row.map((cell) => `<td>${escapeHTML(cell)}</td>`).join("")}</tr>`
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;
    downloadFile(content, "application/vnd.ms-excel;charset=utf-8;", "xls");
  };

  const handleShare = async () => {
    try {
      const shareUrl = getShareUrl?.();
      const copied = await copyText(shareUrl || "");
      if (!copied) {
        throw new Error("copy failed");
      }
      message.success(formatMessage({ id: "insight.share.success" }));
    } catch (error) {
      message.error(formatMessage({ id: "insight.share.failed" }));
    }
  };

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
      { histogramProps?.histogramData && <Histogram {...histogramProps}/>}
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
      <span className={styles.exportActions}>
        <Icon
          type="share-alt"
          title={formatMessage({ id: "insight.share.copy" })}
          onClick={handleShare}
        />
        <Icon
          type="file-text"
          title={formatMessage({ id: "insight.export.csv" })}
          onClick={() => handleExport("csv")}
        />
        <Icon
          type="file-excel"
          title={formatMessage({ id: "insight.export.excel" })}
          onClick={() => handleExport("excel")}
        />
      </span>
      <InsightConfig 
        searchConfig={searchConfig}
        onSearchConfigChange={onSearchConfigChange}
        layoutConfig={layoutConfig}
      />
    </div>
  );
})
