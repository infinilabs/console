import { Empty, Input, Spin, Table } from "antd";
import styles from "./index.less"
import DatePicker from "@/common/src/DatePicker";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatESSearchResult, formatTimeRange } from "@/lib/elasticsearch/util";
import { formatMessage } from "umi/locale";
import request from "@/utils/request";
import moment from "moment";
import { getTimezone } from "@/utils/utils";
import ListView from "@/components/ListView";
import { ESPrefix } from "@/services/common";
import Side from "../Side";
import { WidgetRender } from "@/pages/DataManagement/View/WidgetLoader";
import { cloneDeep } from "lodash";
import { Link } from "umi";
import InstallAgent from "@/components/InstallAgent";

const COLORS = {
    'INFO': '#e8eef2',
    'WARN': '#e99d43',
    'ERROR': '#ff3f3f'
}

export default (props) => {
    const { timeRange, isAgent, refresh, aggs, queryFilters = [], extraColumns = [] } = props;

    const ref = useRef(null);

    const timeField = "timestamp";
    const indexName = ".infini_logs";

    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(false)

    const [queryParams, setQueryParams] = useState({
        size: 20,
        from: 0,
        sort: {
            [timeField]: 'desc'
        },
        keyword: ''
    })

    const fetchData = async (queryParams, timeRange, aggs, queryFilters) => {
        if (!timeRange) return;
        setLoading(true)
        const newTimeRange = formatTimeRange(timeRange);
        const filters = [...queryFilters]
        if (queryParams?.filters) {
            Object.keys(queryParams.filters).map((field) => {
              const values = queryParams.filters[field];
              if (Array.isArray(values)) {
                values.forEach((item) => {
                    filters.push({
                        'term': { [field]: item }
                    })
                });
              } else {
                if (values) {
                    filters.push({
                        'term': { [field]: values }
                    })
                }
              }
            });
        }
        if (queryParams?.keyword) {
            filters.push({ 
                query_string: {
                    query: `*${queryParams.keyword}*`,
                    fields: ['payload.message'],
                }
            });
        }
        const res = await request(`${ESPrefix}/infini_default_system_cluster/search/ese?timeout=60m`, {
            method: 'POST',
            body: {
                index: indexName,
                body: {
                    aggs,
                    query: {
                        "bool": {
                            "filter": [
                                {
                                    "range": {
                                        "timestamp": {
                                            "gte": newTimeRange.min,
                                            "lte": newTimeRange.max
                                        }
                                    }
                                },
                                ...filters
                            ],
                            "should": [],
                            "must_not": []
                        }
                    },
                    size: queryParams.size,
                    from: queryParams.from,
                    sort: queryParams.sort ? Object.keys(queryParams.sort).filter((key) => !!queryParams.sort[key]).map((key) => ({
                        [key]: {
                            "order": queryParams.sort[key]
                        }
                    })) : []
                }
            }
        })
        if (res && !res.error) {
            const rs = formatESSearchResult(res);
            setResult(rs)
        }
        setLoading(false)
    }

    const onTableChange = (pagination, filters, sorter, extra) => {
        const sortOrder = sorter.order ? sorter.order.replace("end", "") : null;
        if (queryParams?.sort[sorter.field] !== sortOrder) {
            setQueryParams((st) => ({ ...st, sort: {
                ...(queryParams.sort || {}),
                [sorter.field]: sortOrder
            }}));
        }
    };

    useEffect(() => {
        fetchData(queryParams, timeRange, aggs, queryFilters)
    }, [JSON.stringify(queryParams), timeRange, JSON.stringify(aggs), JSON.stringify(queryFilters)])

    const columns = [
        {
            title: formatMessage({ id: "cluster.monitor.logs.timestamp" }),
            key: timeField,
            dataIndex: timeField,
            width: 170,
            render: (value) =>
                moment(value)
                .tz(getTimezone())
                .format("YYYY-MM-DD HH:mm:ss"),
            sorter: true,
            sortOrder: queryParams.sort?.[timeField] ? `${queryParams.sort?.[timeField]}end` : undefined
        },
        {
            title: formatMessage({ id: "cluster.monitor.logs.type" }),
            key: "metadata.name",
            dataIndex: "metadata.name",
            width: 100,
        },
        {
            title: formatMessage({ id: "cluster.monitor.logs.level" }),
            key: "payload.level",
            dataIndex: "payload.level",
            width: 88,
            render: (value, record) => {
                if (!value) return '-'
                const colors = {
                    INFO: {
                        background: COLORS.INFO,
                        color: "#959ea0",
                    },
                    WARN: {
                        background: COLORS.WARN,
                        color: "#fff",
                    },
                    ERROR: {
                        background: COLORS.ERROR,
                        color: "#fff",
                    },
                };
                return (
                    <div
                        style={{
                            width: 54,
                            height: 18,
                            fontWeight: 600,
                            lineHeight: "18px",
                            textAlign: "center",
                            ...(colors[value] || colors[value]),
                        }}
                    >
                        {value}
                    </div>
                );
            },
        },
        ...extraColumns,
        {
            title: formatMessage({ id: "cluster.monitor.logs.message" }),
            key: "payload.message",
            dataIndex: "payload.message",
        },
    ];

    const histogram = {
        bucket_size: "auto",
        is_stack: true,
        format: {
            type: "number",
            pattern: "0.00a",
        },
        legend: false,
        colors: COLORS,
        series: [
            {
                metric: {
                    formula: "a",
                    groups: [
                        {
                            field: "payload.level",
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
                    cluster_id: "infini_default_system_cluster",
                    indices: [indexName],
                    time_field: timeField,
                },
                type: "date-histogram",
            },
        ],
    }

    const isNotEmpty = useMemo(() => {
        return result?.data?.length > 0
    }, [result?.data?.length])

    return (
        <Spin spinning={loading}>
            <div className={styles.logs} style={isNotEmpty ? {} : { justifyContent: 'center', alignItems: 'center'}}>
                {
                    isNotEmpty ? (
                        <>
                            <div className={styles.side}>
                                <Side
                                    aggs={aggs}
                                    data={result?.aggregations || {}}
                                    filters={queryParams?.filters || {}}
                                    onFacetChange={(v) => {
                                        const newFilters = cloneDeep(queryParams.filters) || {}
                                        if (!v.value || v.value.length === 0) {
                                            delete newFilters[v.field];
                                        } else {
                                            newFilters[v.field] = v.value;
                                        }
                                        setQueryParams((st) => ({ ...st, from: 0, filters: newFilters }));
                                    }}
                                    onReset={() => {
                                        setQueryParams((st) => ({ ...st, from: 0, filters: {} }));
                                    }}
                                />
                            </div>
                            <div className={styles.result}>
                                <div className={styles.header}>
                                    <Input.Search 
                                        style={{ maxWidth: 600 }} 
                                        placeholder={formatMessage({ id: "cluster.monitor.logs.search.placeholder" })} 
                                        onSearch={value => {
                                            setQueryParams((st) => ({ ...st, from: 0, keyword: value }));
                                        }} 
                                        enterButton
                                    />
                                </div>
                                <div className={styles.histogram}>
                                    <WidgetRender
                                        widget={histogram}
                                        range={{
                                            from: timeRange.min,
                                            to: timeRange.max,
                                            timeField: timeField,
                                        }}
                                        queryParams={queryParams?.filters || {}}
                                        refresh={refresh}
                                    />
                                </div>
                                <div className={styles.table}>
                                    <Table 
                                        size={"small"}
                                        rowKey={"id"}
                                        columns={columns} 
                                        dataSource={result?.data || []}
                                        onChange={onTableChange}
                                        pagination={{
                                            size: "small",
                                            pageSize: queryParams.size,
                                            current: Math.ceil(queryParams.from / queryParams.size) + 1,
                                            total: result?.total?.value || result?.total || 0,
                                            onChange: (page, pageSize) => {
                                                setQueryParams((st) => ({
                                                    ...st,
                                                    from: (page - 1) * st.size,
                                                }));
                                            },
                                            showSizeChanger: true,
                                            onShowSizeChange: (_, size) => {
                                                setQueryParams((st) => ({ ...st, from: 0, size }));
                                            },
                                            showTotal: (total, range) =>
                                            `${range[0]}-${range[1]} of ${total} items`,
                                        }}
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        <Empty 
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={formatMessage({ id: `cluster.monitor.logs.empty.${isAgent ? 'agent' : 'agentless'}` })}
                        >
                            <div style={{width: 644}}>{!isAgent && <InstallAgent autoInit={false}/>}</div>
                        </Empty>
                    )
                }
            </div>  
        </Spin>
    );
}