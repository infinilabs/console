import { Card, Empty, Icon, Spin, Table } from "antd";
import styles from "./index.less"
import DatePicker from "@/common/src/DatePicker";
import { useEffect, useMemo, useRef, useState } from "react";
import { buildContainsQueryString, formatESSearchResult, formatTimeRange } from "@/lib/elasticsearch/util";
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
import { getSystemClusterID } from "@/utils/setup";
import SearchInput from "@/components/infini/SearchInput";

const COLORS = {
    'INFO': '#e8eef2',
    'WARN': '#e99d43',
    'ERROR': '#ff3f3f'
}

const buildTimestampKeywordFilter = (keyword, timeField) => {
    const value = `${keyword ?? ""}`.trim();
    if (!value) {
        return null;
    }
    const parsed = moment.tz(
        value,
        ["YYYY-MM-DD HH:mm:ss", "YYYY-MM-DDTHH:mm:ss"],
        true,
        getTimezone()
    );
    if (!parsed.isValid()) {
        return null;
    }
    return {
        range: {
            [timeField]: {
                gte: parsed.clone().startOf("second").toISOString(),
                lte: parsed.clone().endOf("second").toISOString(),
                format: "strict_date_optional_time",
            }
        }
    };
};

const buildLogSearchFilters = (queryParams = {}, queryFilters = [], timeField) => {
    const filters = [...queryFilters];
    if (queryParams?.filters) {
        Object.keys(queryParams.filters).map((field) => {
            const values = queryParams.filters[field];
            if (Array.isArray(values)) {
                values.forEach((item) => {
                    filters.push({
                        term: { [field]: item }
                    });
                });
            } else if (values) {
                filters.push({
                    term: { [field]: values }
                });
            }
        });
    }
    const keywordFilters = [];
    const searchQuery = buildContainsQueryString(queryParams?.keyword);
    if (searchQuery) {
        keywordFilters.push({
            query_string: {
                query: searchQuery,
                fields: ["payload.message"],
                analyze_wildcard: true,
            }
        });
    }
    const timestampKeywordFilter = buildTimestampKeywordFilter(queryParams?.keyword, timeField);
    if (timestampKeywordFilter) {
        keywordFilters.push(timestampKeywordFilter);
    }
    if (keywordFilters.length === 1) {
        filters.push(keywordFilters[0]);
    } else if (keywordFilters.length > 1) {
        filters.push({
            bool: {
                should: keywordFilters,
                minimum_should_match: 1,
            }
        });
    }
    return filters;
};

export default (props) => {
    const { timeRange, isAgent, refresh, aggs, queryFilters = [], extraColumns = [], handleTimeChange } = props;

    const ref = useRef(null);

    const timeField = "timestamp";
    const indexName = ".infini_logs";

    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(false)
    const [sideVisible, setSideVisible] = useState(true)

    const [queryParams, setQueryParams] = useState({
        size: 20,
        from: 0,
        sort: {
            [timeField]: 'desc'
        },
        keyword: ''
    })
    const [searchKeyword, setSearchKeyword] = useState("")

    const fetchData = async (queryParams, timeRange, aggs, queryFilters) => {
        if (!timeRange) return;
        setLoading(true)
        const newTimeRange = formatTimeRange(timeRange);
        const filters = buildLogSearchFilters(queryParams, queryFilters, timeField);
        const res = await request(`${ESPrefix}/${getSystemClusterID()}/search/ese?timeout=60m`, {
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

    const lastTimeRangeKeyRef = useRef(`${timeRange?.min || ""}:${timeRange?.max || ""}`);

    useEffect(() => {
        const nextTimeRangeKey = `${timeRange?.min || ""}:${timeRange?.max || ""}`;
        if (lastTimeRangeKeyRef.current !== nextTimeRangeKey && queryParams.from !== 0) {
            setQueryParams((st) => ({ ...st, from: 0 }));
        }
        lastTimeRangeKeyRef.current = nextTimeRangeKey;
    }, [timeRange?.min, timeRange?.max, queryParams.from]);

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
                    cluster_id: getSystemClusterID(),
                    indices: [indexName],
                    time_field: timeField,
                },
                type: "date-histogram",
            },
        ],
    }

    const histogramQuery = useMemo(() => {
        const filters = buildLogSearchFilters(
            {
                keyword: queryParams?.keyword,
            },
            queryFilters,
            timeField
        );
        if (filters.length === 0) {
            return undefined;
        }
        return JSON.stringify({
            bool: {
                filter: filters,
                should: [],
                must_not: [],
            }
        });
    }, [queryParams?.keyword, JSON.stringify(queryFilters)]);

    const totalHits = useMemo(() => {
        return result?.total?.value || result?.total || 0;
    }, [result?.total]);

    const showHistogram = useMemo(() => {
        const levelBuckets = result?.aggregations?.Level?.buckets;
        if (!levelBuckets) return true;
        return levelBuckets.length > 0;
    }, [result?.aggregations?.Level]);

    const isNotEmpty = useMemo(() => {
        return totalHits > 0
    }, [totalHits])

    const emptyText = useMemo(() => (
        <Empty 
            className={styles.emptyBlock}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={formatMessage({ id: "cluster.monitor.logs.empty.agent" })}
        />
    ), [isAgent]);

    const onHistogramQueriesChange = (nextQueries = {}) => {
        const nextRange = nextQueries?.range;
        if (!nextRange?.from || !nextRange?.to || typeof handleTimeChange !== "function") {
            return;
        }
        setQueryParams((st) => ({ ...st, from: 0 }));
        handleTimeChange({
            start: nextRange.from,
            end: nextRange.to,
        });
    }

    return (
        <Spin spinning={loading}>
            <div className={styles.logs}>
                {isAgent || isNotEmpty ? (
                <div className={`${styles.logLayout} ${sideVisible ? styles.expand : styles.collapse}`}>
                            <div className={styles.sideWrap}>
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
                            <div className={styles.contentWrap}>
                                <span
                                    className={styles.expandAndCollapse}
                                    onClick={() => setSideVisible((visible) => !visible)}
                                    title={
                                        sideVisible
                                            ? formatMessage({ id: "listview.side.button.collapse" })
                                            : formatMessage({ id: "listview.side.button.expand" })
                                    }
                                >
                                    <Icon type={sideVisible ? "left" : "right"} style={{ fontSize: 12 }} />
                                </span>
                                <Card className={styles.resultCard}>
                                    <div className={styles.header}>
                                        <div className={styles.searchBox}>
                                            <SearchInput
                                                value={searchKeyword}
                                                allowClear
                                                placeholder={formatMessage({ id: "cluster.monitor.logs.search.placeholder" })} 
                                                onSearch={value => {
                                                    const nextKeyword = `${value ?? ""}`.trim();
                                                    setSearchKeyword(nextKeyword);
                                                    setQueryParams((st) => ({ ...st, from: 0, keyword: nextKeyword }));
                                                }} 
                                                onChange={(e) => {
                                                    const nextKeyword = e?.target?.value ?? "";
                                                    setSearchKeyword(nextKeyword);
                                                    if (nextKeyword === "") {
                                                        setQueryParams((st) => ({ ...st, from: 0, keyword: "" }));
                                                    }
                                                }}
                                                enterButton={formatMessage({ id: "form.button.search" })}
                                            />
                                        </div>
                                    </div>
                                    {showHistogram && (
                                    <div className={styles.histogram}>
                                        <WidgetRender
                                            widget={histogram}
                                            range={{
                                                from: timeRange.min,
                                                to: timeRange.max,
                                                timeField: timeField,
                                            }}
                                            query={histogramQuery}
                                            queryParams={queryParams?.filters || {}}
                                            refresh={refresh}
                                            onGlobalQueriesChange={onHistogramQueriesChange}
                                        />
                                    </div>
                                    )}
                                    <div className={styles.table}>
                                        <Table 
                                            size={"small"}
                                            rowKey={"id"}
                                            columns={columns} 
                                            dataSource={result?.data || []}
                                            onChange={onTableChange}
                                            locale={{
                                                emptyText,
                                            }}
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
                                </Card>
                            </div>
                        </div>
                ) : (
                    <div className={styles.emptyState}>
                        <Empty 
                            className={styles.emptyBlock}
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={formatMessage({ id: "cluster.monitor.logs.empty.agentless" })}
                        >
                            <div className={styles.installAgentWrap}>
                                <InstallAgent autoInit={false} centerToggle={true} />
                            </div>
                        </Empty>
                    </div>
                )}
            </div>  
        </Spin>
    );
}
