import React, {
  useState,
  useRef,
  useReducer,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import useFetch from "@/lib/hooks/use_fetch";
import "./index.scss";
import request from "@/utils/request";
import { Button, Card, Icon } from "antd";
import { formatMessage } from "umi/locale";
import { JsonParam, useQueryParam } from "use-query-params";
import Header from "./Header";
import List from "./List";
import Side from "./Side";
import Drawer, { IDrawerRef } from "./Drawer";
import Title from "./Detail/Title";
import Content from "./Detail/Content";
import { useLocalStorage } from "@/lib/hooks/storage";

interface IQueryParams {
  from: number;
  size: number;
  keyword: string;
}

interface IDetail {
  key: string;
  title: string;
  titleId?: string;
  component: any;
}

interface IRecord {
  [key: string]: any;
}

interface IProps {
  extraQueryFields?: string[];
  searchAction: string;
  searchHighlightFields: string[];
  infoAction: string;
  facetLabels: { [key: string]: string };
  selectFilterLabels?: { [key: string]: string };
  aggsParams: { field: string; params: { [key: string]: any } }[];
  sideSorterOptions: { label: string; key: string }[];
  details: IDetail[];
  searchAutoCompleteConfig: {
    showStatus?: boolean;
    showTags?: boolean;
    getOptionMeta: (
      item: any
    ) => {
      title: string;
      desc: string;
      right?: string;
      tags?: string[];
      status?: any;
    };
  };
  listItemConfig: {
    component: React.FC<any>;
    getId: (item: any) => string | undefined;
  };
  tableConfig: {
    component: React.FC<any>;
  };
  detailTitleConfig: {
    getLabels: (item: any) => string[];
    getStatus?: (item: any) => string;
  };
  headerConfig?: {
    getExtra: (props: any) => React.ReactNode[];
  };
}

const initialQueryParams = {
  from: 0,
  size: 10,
  keyword: "",
};
const tableDefaultPageSize = 20;
const cardDefaultPageSize = initialQueryParams.size;
const getDefaultPageSizeByDisplayType = (displayType: "card" | "table") =>
  displayType === "table" ? tableDefaultPageSize : cardDefaultPageSize;
const stripLegacyOverviewURLParams = (params: any) => {
  if (!params) {
    return params;
  }
  let changed = false;
  const next = { ...params };
  Object.keys(next).forEach((key) => {
    if (
      key === "from" ||
      key === "size" ||
      key === "display_type" ||
      /_(card|table)_(from|size)$/.test(key)
    ) {
      delete next[key];
      changed = true;
    }
  });
  return changed ? next : params;
};

export default forwardRef((props: IProps, ref: any) => {
  const [param, setParam] = useQueryParam("_g", JsonParam);
  const currentTab = param?.tab || "clusters";

  const {
    extraQueryFields = [],
    searchAction,
    searchHighlightFields,
    infoAction,
    facetLabels,
    selectFilterLabels,
    aggsParams,
    sideSorterOptions,
    details,
    searchAutoCompleteConfig,
    listItemConfig,
    tableConfig,
    detailTitleConfig,
    headerConfig = {},
  } = props;
  const drawRef = useRef<IDrawerRef>(null);
  const [sideVisible, setSideVisible] = useState(false);

  const [searchField, setSearchField] = useState<string>();
  const [selectedItem, setSelectedItem] = useState<IRecord>({});
  const [cardInfos, setCardInfos] = useState<Record<string, any>>({});
  const [cardInfoLoadings, setCardInfoLoadings] = useState<Record<string, boolean>>({});

  const [dispalyTypeObj, setDispalyTypeObj] = useLocalStorage(
    "console:overview:displayType",
    {
      clusters: "card",
      nodes: "card",
      indices: "card",
      hosts: "card",
    },
    {
      encode: JSON.stringify,
      decode: JSON.parse,
    }
  );
  const displayType = dispalyTypeObj[currentTab] || "card";
  const defaultPageSize = getDefaultPageSizeByDisplayType(displayType);

  function reducer(
    queryParams: IQueryParams,
    action: { type: string; value: any }
  ) {
    switch (action.type) {
      case "search":
        return {
          size: queryParams.size,
          from: initialQueryParams.from,
          keyword: action.value,
        };
      case "pagination":
        return {
          ...queryParams,
          from: (action.value - 1) * queryParams.size,
        };
      case "pageSizeChange":
        return {
          ...queryParams,
          size: action.value,
        };
      case "setPageSizeAndReset":
        return {
          ...queryParams,
          from: 0,
          size: action.value,
        };
      case "setQuery":
        return {
          ...queryParams,
          ...action.value,
        };
      default:
        throw new Error();
    }
  }
  const [queryParams, dispatch] = useReducer(reducer, {
    from: initialQueryParams.from,
    size: defaultPageSize,
    keyword: param?.keyword ?? initialQueryParams.keyword,
  });

  const onDisplayTypeChange = (value: string) => {
    const nextDisplayType = value === "table" ? "table" : "card";
    setDispalyTypeObj({ ...dispalyTypeObj, [currentTab]: value });
    dispatch({
      type: "setPageSizeAndReset",
      value: getDefaultPageSizeByDisplayType(nextDisplayType),
    });
  };

  useEffect(() => {
    if (dispalyTypeObj[currentTab] !== displayType) {
      setDispalyTypeObj({ ...dispalyTypeObj, [currentTab]: displayType });
    }
  }, [currentTab, displayType, dispalyTypeObj, setDispalyTypeObj]);

  useEffect(() => {
    const nextParam = stripLegacyOverviewURLParams(param);
    if (nextParam !== param) {
      setParam(nextParam);
    }
  }, [param, setParam]);

  useEffect(() => {
    dispatch({
      type: "setQuery",
      value: {
        from: initialQueryParams.from,
        size: getDefaultPageSizeByDisplayType(displayType),
      },
    });
  }, [currentTab, displayType]);
  const { run, loading, value } = useFetch(
    searchAction,
    {
      method: "POST",
      body: {
        ...queryParams,
        aggs: aggsParams,
        highlight: {
          fields: searchHighlightFields,
          fragment_size: 200,
          number_of_fragment: 1,
        },
        filter: param?.filters || {},
        sort: param?.sort || [],
        search_field: searchField || searchAutoCompleteConfig?.defaultSearchField,
      },
    },
    [queryParams, param?.filters, param?.sort, aggsParams, searchHighlightFields, searchField, searchAutoCompleteConfig?.defaultSearchField]
  );

  const result = (value as any)?.hits || {};
  const { hits = [] } = result;
  const hasSide = sideSorterOptions.length > 0 || aggsParams.length > 0;

  const initQueryParams = () => {
    extraQueryFields.forEach((item) => {
      if (param?.[item]) {
        initialQueryParams[item] = param?.[item];
      }
    });
  };

  const onFacetChange = (v: { value: string[]; field: string }) => {
    const { filters = {}, ...restParams } = param;
    if (!v.value || v.value.length === 0) {
      delete filters[v.field];
    } else {
      filters[v.field] = v.value;
    }
    if (Object.keys(filters).length === 0) {
      setParam(restParams);
    } else {
      setParam({
        ...param,
        filters,
      });
    }
    dispatch({ type: "pagination", value: 1 })
  };

  const onSideReset = () => {
    const { filters, ...restParams } = param || {};
    setParam(restParams);
    dispatch({ type: "pagination", value: 1 });
  };

  const onRefresh = () => {
    run();
  };

  useEffect(() => {
    if (displayType !== "card" || loading || hits.length === 0 || !infoAction) {
      return;
    }
    const ids = hits
      .map((item) => listItemConfig.getId(item))
      .filter((id): id is string => !!id && !cardInfos[id]);
    if (ids.length === 0) {
      return;
    }
    let cancelled = false;
    const fetchListInfo = async () => {
      setCardInfoLoadings((current) => {
        const next = { ...current };
        ids.forEach((id) => {
          next[id] = true;
        });
        return next;
      });
      try {
        const res = await request(
          infoAction,
          {
            method: "POST",
            body: ids,
          },
          false,
          false
        );
        if (!cancelled && res && !res.error) {
          setCardInfos((current) => ({
            ...current,
            ...res,
          }));
        }
      } finally {
        if (!cancelled) {
          setCardInfoLoadings((current) => {
            const next = { ...current };
            ids.forEach((id) => {
              next[id] = false;
            });
            return next;
          });
        }
      }
    };
    fetchListInfo();
    return () => {
      cancelled = true;
    };
  }, [displayType, loading, hits, infoAction, listItemConfig, cardInfos]);

  useEffect(() => {
    initQueryParams();
  }, [JSON.stringify(param)]);

  useImperativeHandle(ref, () => ({
    refresh: () => run(),
  }));

  return (
    <>
      <div className={`overview-wrapper ${hasSide && sideVisible ? "expand" : "collapse"}`}>
        {hasSide ? (
          <div className="overview-side-wrap">
            {sideVisible ? (
              <Side
                sorterOptions={sideSorterOptions}
                sorterValues={param?.sort || []}
                onSorterChange={(sort) => {
                  setParam({
                    ...param,
                    sort,
                  });
                }}
                facetLabels={facetLabels}
                aggsConfig={{
                  action: searchAction,
                  params: aggsParams,
                }}
                filters={param?.filters || {}}
                onFacetChange={onFacetChange}
                onReset={onSideReset}
              />
            ) : null}
          </div>
        ) : null}
        <div className="overview-content-wrap">
          {hasSide ? (
            <span
              className="overview-expand-and-collapse"
              onClick={() => setSideVisible((visible) => !visible)}
              title={
                sideVisible
                  ? formatMessage({ id: "listview.side.button.collapse" })
                  : formatMessage({ id: "listview.side.button.expand" })
              }
            >
              <Icon type={sideVisible ? "left" : "right"} style={{ fontSize: 12 }} />
            </span>
          ) : null}
          <Card className="overview-content-card">
            <div className="content">
              <Header
                searchField={searchField}
                filters={param?.filters || {}}
                selectFilterLabels={selectFilterLabels || facetLabels}
                onSearchFieldChange={(value) => {
                  setSearchField(value);
                  setParam({ ...param, search_field: value });
                }}
                defaultSearchValue={queryParams?.keyword}
                onSearchChange={(value) => {
                  dispatch({ type: "search", value })
                }}
                onFacetChange={onFacetChange}
                dispalyType={displayType}
                onDisplayTypeChange={onDisplayTypeChange}
                autoCompleteConfig={{
                  action: searchAction,
                  highlightFields: searchHighlightFields,
                  ...searchAutoCompleteConfig,
                }}
                {...headerConfig}
                getExtra={(headerProps) => {
                  const extras = headerConfig.getExtra
                    ? headerConfig.getExtra(headerProps)
                    : [];
                  return [
                    <Button key="refresh" icon="redo" onClick={onRefresh}>
                      {formatMessage({ id: "form.button.refresh" })}
                    </Button>,
                    ...extras,
                  ];
                }}
                onCleanSuccess={() => {
                  dispatch({ type: "pagination", value: 1 })
                }}
              />
              <div className="search-result">
                {displayType == "card" ? (
                  <List
                    dataSource={hits}
                    total={result?.total?.value || 0}
                    from={queryParams.from}
                    pageSize={queryParams.size}
                    loading={loading}
                    onPageChange={(page) =>
                      dispatch({ type: "pagination", value: page })
                    }
                    onPageSizeChange={(size) =>
                      dispatch({ type: "pageSizeChange", value: size })
                    }
                    renderItem={(item) => {
                      const infoField = listItemConfig.getId(item);
                      return (
                        <listItemConfig.component
                          data={item}
                          id={infoField}
                          info={cardInfos[infoField]}
                          infoLoading={!!cardInfoLoadings[infoField]}
                          isActive={listItemConfig.getId(selectedItem?._id) == infoField}
                          onSelect={() => {
                            setSelectedItem(item);
                            drawRef.current?.open();
                          }}
                          onChangeFacet={onFacetChange}
                          infoAction={infoAction}
                          parentLoading={loading}
                        />
                      );
                    }}
                  />
                ) : (
                  <tableConfig.component
                    infoAction={infoAction}
                    dataSource={hits.map((item) => ({...item, id: listItemConfig.getId(item)}))}
                    total={result?.total?.value || 0}
                    from={queryParams.from}
                    pageSize={queryParams.size}
                    loading={loading}
                    onPageChange={(page) =>
                      dispatch({ type: "pagination", value: page })
                    }
                    onPageSizeChange={(size) =>
                      dispatch({ type: "pageSizeChange", value: size })
                    }
                    onRowClick={(item) => {
                      setSelectedItem(item);
                      drawRef.current?.open();
                    }}
                    parentLoading={loading}
                  />
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
      <Drawer
        ref={drawRef}
        width={800}
        title={
          <Title
            labels={detailTitleConfig.getLabels(selectedItem)}
            status={
              detailTitleConfig.getStatus
                ? detailTitleConfig.getStatus(selectedItem)
                : ""
            }
          />
        }
        content={
          <Content
            data={selectedItem}
            details={details}
            onClose={() => {
              drawRef.current?.close();
              run();
            }}
          />
        }
        onClose={() => setSelectedItem({})}
      />
    </>
  );
});
