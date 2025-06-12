import PageHeaderWrapper from "@/components/PageHeaderWrapper";
import { useRef, useCallback, useState, useEffect } from "react";
import { Button, Dropdown, Icon, Menu, Modal } from "antd";
import { formatMessage } from "umi/locale";
import { formatESSearchResult } from "@/lib/elasticsearch/util";
import { formatUtcTimeToLocal } from "@/utils/utils";
import { hasAuthority } from "@/utils/authority";
import request from "@/utils/request";
import ListView from "@/components/ListView";
import GenerateDesc from "@/pages/Overview/components/Activities/GenerateDesc";
import { getSystemClusterID } from "@/utils/setup";

const opers = {
  delete: "deleted",
  update: "changed",
  create: "created",
};

const iconType = {
  delete: "delete",
  update: "form",
  create: "plus-square",
};

const serializeDiffValue = (v) => {
  if (typeof v == "string") {
    return v;
  }
  return JSON.stringify(v);
};

const generateDiff = (diff) => {
  return (diff || []).map((changeLog, i) => {
    const fieldPath = changeLog.path.join(".");
    switch (changeLog.type) {
      case "create":
        return (
          <div key={i} style={{ background: "#E6FFEC" }}>
            <Icon style={{ fontSize: 12, marginRight: 10 }} type="plus" />
            {fieldPath}: {serializeDiffValue(changeLog.to)}
          </div>
        );
      case "delete":
        return (
          <div key={i} style={{ background: "#FFEBE9" }}>
            <Icon style={{ fontSize: 12, marginRight: 10 }} type="minus" />
            {fieldPath}: {serializeDiffValue(changeLog.from)}
          </div>
        );
      case "update":
        return (
          <div key={i}>
            <Icon style={{ fontSize: 12, marginRight: 10 }} type="edit" />
            {fieldPath}: {serializeDiffValue(changeLog.from)}{" "}
            <Icon type="arrow-right" />
            {serializeDiffValue(changeLog.to)}
          </div>
        );
    }
  });
};

const DiffItem = ({ diff }) => {
  const [state, setState] = useState({
    hasMore: false,
    style: { maxHeight: 63, overflowY: "hidden" },
  });
  const itemRef = useCallback((node) => {
    if (node && node.scrollHeight > node.offsetHeight) {
      setState((st) => {
        return {
          ...st,
          hasMore: true,
        };
      });
    }
  }, []);

  return (
    <div>
      <div ref={itemRef} style={state.style}>
        {generateDiff(diff || {})}
      </div>
      {state.hasMore ? (
        <div>
          <a
            onClick={() => {
              setState({
                hasMore: false,
                style: {},
              });
            }}
          >
            more
          </a>
        </div>
      ) : null}
    </div>
  );
};

export default (props) => {
  const ref = useRef(null);
  const clusterID = getSystemClusterID();
  const collectionName = "activity";
  const timeField = "timestamp"; //timestamp
  const [histogramState, setHistogramState] = useState({
    enable: true,
    visible: true,
    widget: {},
  });

  const formatTableData = (value) => {
    let dataNew = formatESSearchResult(value);
    return dataNew;
  };
  const columns = [
    {
      title: "Cluster",
      key: "metadata.labels.cluster_name",
      aggregable: true,
      searchable: true,
      visible: false,
    },
    {
      title: "Node",
      key: "metadata.labels.node_name",
      aggregable: true,
      searchable: true,
      visible: false,
    },
    {
      title: "Index",
      key: "metadata.labels.index_name",
      aggregable: true,
      searchable: true,
      visible: false,
    },
    {
      title: "Event",
      key: "metadata.name",
      aggregable: true,
      searchable: true,
      visible: false,
    },
    {
      title: "To",
      key: "metadata.labels.to",
      searchable: true,
      visible: false,
    },
    {
      title: "Type",
      key: "metadata.type",
      aggregable: true,
      searchable: true,
      visible: false,
    },
    {
      title: "Timestamp",
      key: "timestamp",
      sortable: true,
      render: (text, record) => {
        return formatUtcTimeToLocal(record.timestamp);
      },
    },
  ];

  const viewLayoutItemRender = (record) => {
    if (!record) {
      return null;
    }
    let hit = { _source: record };
    return (
      <>
        <div
          style={{
            marginTop: 6,
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <Icon
            type={iconType?.[record?.metadata?.type] ?? "edit"}
            style={{ color: "#1890ff" }}
            title={record?.metadata?.type}
          />
          <span title={record.timestamp}>
            {formatUtcTimeToLocal(record.timestamp)}
          </span>
        </div>
        <div>
          <GenerateDesc opers hit={hit} />
        </div>
        {record.changelog && record.changelog.length > 0 ? (
          <DiffItem diff={record.changelog} />
        ) : null}
      </>
    );
  };

  const initHistogramWidget = async () => {
    let res = await request(`/collection/${collectionName}/metadata`);
    let indexName = res?.metadata?.index_name || "";
    if (indexName) {
      let widget = {
        bucket_size: "auto",
        is_stack: true,
        format: {
          type: "number",
          pattern: "0.00a",
        },
        legend: false,
        series: [
          {
            metric: {
              formula: "a",
              groups: [
                {
                  field: "metadata.name",
                  limit: 10,
                },
              ],
              items: [
                {
                  field: "*",
                  name: "a",
                  statistic: "count",
                },
              ],
              sort: [
                {
                  direction: "desc",
                  key: "_count",
                },
              ],
            },
            queries: {
              cluster_id: clusterID,
              indices: [indexName],
              time_field: timeField,
            },
            type: "date-histogram",
          },
        ],
      };
      setHistogramState((st) => ({ ...st, widget }));
    }
  };
  useEffect(() => {
    if (histogramState.enable) {
      initHistogramWidget();
    }
  }, []);

  return (
    <PageHeaderWrapper>
      <ListView
        ref={ref}
        clusterID={clusterID}
        collectionName={collectionName}
        viewLayout="timeline"
        viewLayoutItemRender={viewLayoutItemRender}
        columns={columns}
        formatDataSource={(value) => {
          return formatTableData(value);
        }}
        defaultQueryParams={{
          from: 0,
          size: 20,
          timeRange: { from: "now-7d", to: "now", timeField: timeField },
          sort: [[timeField, "desc"]],
        }}
        dateTimeEnable={true}
        isRefreshPaused={true}
        sortEnable={true}
        sideEnable={true}
        sideVisible={true}
        sidePlacement="left"
        histogramEnable={histogramState.enable}
        histogramVisible={histogramState.visible}
        histogramWidget={histogramState.widget}
      />
    </PageHeaderWrapper>
  );
};
