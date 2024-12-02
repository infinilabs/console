import {
  Input,
  Icon,
  List,
  Card,
  Button,
  Drawer,
  AutoComplete,
  Select,
} from "antd";
import React, { useState, useMemo, useEffect, useRef } from "react";

import useFetch from "@/lib/hooks/use_fetch";
import { ESPrefix } from "@/services/common";
import "../clusters.scss";
import IndexDetail from "./index_detail";
import { TagList } from "../tag";
import IndexCard from "./index_card";
import { CardDetailTitle } from "../detail/card_detail_title";
import { Route } from "umi";
import { JsonParam, QueryParamProvider, useQueryParam } from "use-query-params";
import { HealthStatusCircle } from "@/components/infini/health_status_circle";
import request from "@/utils/request";
import {
  buildSearchAggs,
  buildSearchFilter,
  buildSearchHighlight,
  getSearchFacets,
} from "@/lib/elasticsearch/search";
import SearchFacet from "../search_facet";
import SearchSelectFacet from "../search_select_facet";
import { FilteredTags } from "../filtered_tags";
import Sorter from "@/components/infini/search/sort/sort";

const { Search } = Input;
const InputGroup = Input.Group;
const Option = Select.Option;
const filterWidth = 120;

const facetLabels = {
  "metadata.cluster_name": "cluster",
  "metadata.labels.health_status": "health",
  "metadata.labels.state": "state",
};

const aggsParams = [
  { field: "metadata.cluster_name", params: { size: 500 } },
  { field: "metadata.labels.state", params: { size: 100 } },
  { field: "metadata.labels.health_status", params: { size: 150 } },
];

const Indices = (props) => {
  const [param, setParam] = useQueryParam("_g", JsonParam);
  const [collapse, setCollapse] = React.useState(false);
  const toggleCollapse = () => {
    setCollapse(!collapse);
  };
  const [searchField, setSearchField] = React.useState("");
  const [searchValue, setSearchValue] = React.useState("");
  const isInitRef = useRef(false);

  const initialQueryParams = {
    from: 0,
    size: 5,
    keyword: "",
  };
  if (param?.index_id) {
    initialQueryParams["index_id"] = param.index_id;
  }
  const initialParams = {
    filters: {},
  };
  function reducer(queryParams, action) {
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
      default:
        throw new Error();
    }
  }
  const [queryParams, dispatch] = React.useReducer(reducer, initialQueryParams);
  useMemo(() => {
    setParam({ ...param, ...queryParams });
  }, [queryParams]);

  const fetchFilterAggs = async () => {
    const res = await request(`${ESPrefix}/index/_search`, {
      method: "POST",
      body: {
        size: 0,
        aggs: aggsParams,
      },
    });
    if (res?.aggregations) {
      const fts = getSearchFacets(res, Object.keys(facetLabels));
      const clusterFts = getSearchFacets(res, ["metadata.cluster_name"]);
      if (fts.length > 0) {
        setFacets({
          chb: fts,
          clusterFts,
        });
      }
    }
  };

  const { loading, error, value } = useFetch(
    `${ESPrefix}/index/_search`,
    {
      method: "POST",
      body: {
        ...queryParams,
        aggs: aggsParams,
        highlight: {
          fields: ["name"],
          fragment_size: 200,
          number_of_fragment: 1,
        },
        filter:
          param?.filters ||
          (isInitRef.current === false ? initialParams.filters : {}),
        sort: param?.sort || [],
        search_field: searchField,
      },
    },
    [queryParams, param?.filters, param?.sort]
  );

  const hits = value?.hits?.hits || [];
  const hitsTotal = value?.hits?.total?.value || 0;

  const [itemDetail, setItemDetail] = React.useState({});
  const handleItemDetail = (item) => {
    setItemDetail(item);
  };
  const [infos, setInfos] = useState({});
  const [facets, setFacets] = useState([]);

  React.useEffect(() => {
    if (hits?.length == 0) {
      return;
    }
    const fetchIndexInfo = async () => {
      const indexIDs = hits?.map((hit) => hit?._source?.metadata?.index_id);
      const res = await request(`${ESPrefix}/index/info`, {
        method: "POST",
        body: indexIDs,
      });
      if (res) {
        setInfos(res);
      }
    };
    fetchIndexInfo();
  }, [hits]);

  React.useEffect(() => {
    if (isInitRef.current === false) {
      isInitRef.current = true;
    }
    if (!param?.filters) {
      setParam({ ...param, filters: initialParams.filters });
    }

    fetchFilterAggs();
  }, []);

  function renderOption(item) {
    const name =
      item?.highlight?.index_name || item?._source?.metadata?.index_name;
    const clusterName =
      item?.highlight?.cluster_name || item?._source?.metadata?.cluster_name;
    return (
      <Select.Option key={item?._id} text={item?._source?.metadata?.index_name}>
        <div className="suggest-item">
          <div className="suggest-line">
            <div>
              <HealthStatusCircle
                status={item?._source?.metadata?.labels?.health_status}
              />
              <span
                className="title"
                dangerouslySetInnerHTML={{ __html: name }}
              />
              &nbsp;&nbsp;(
              <span dangerouslySetInnerHTML={{ __html: clusterName }} />)
            </div>
            <div className="right">
              {/* <span dangerouslySetInnerHTML={{ __html: host }} /> */}
            </div>
          </div>
        </div>
      </Select.Option>
    );
  }
  const [dataSource, setDataSrouce] = useState([]);
  const handleSearch = async (value) => {
    if (!value) {
      setDataSrouce([]);
      return;
    }
    const res = await request(`/elasticsearch/index/_search`, {
      method: "POST",
      body: {
        size: 10,
        keyword: value,
        highlight: {
          fields: [
            "metadta.index_name",
            "metadata.aliases",
            "metadta.cluster_name",
          ],
          fragment_size: 200,
          number_of_fragment: 1,
        },
      },
    });
    if (res) {
      setDataSrouce(res?.hits?.hits || []);
    }
  };
  const [searchOpen, setSearchOpen] = useState(false);

  const onChangeFacet = (v) => {
    setParam((params) => {
      params = params || {};
      const filters = params.filters || {};
      if (!v.value || v.value.length == 0) {
        delete filters[v.field];
      } else {
        filters[v.field] = v.value;
      }
      if (Object.keys(filters).length == 0) {
        delete params["filters"];
        return {
          ...params,
        };
      }
      return {
        ...params,
        filters,
      };
    });
  };

  return (
    <div className="clusters">
      <div className="wrapper">
        <div className={"col left" + (collapse ? " collapse" : "")}>
          <div className="search-line">
            <div className="search-box">
              <InputGroup compact>
                <Select
                  allowClear={true}
                  style={{ width: filterWidth }}
                  dropdownMatchSelectWidth={false}
                  placeholder="Filters"
                  onChange={(value) => {
                    setSearchField(value);
                    setParam({ ...param, search_field: value });
                  }}
                >
                  {Object.keys(facetLabels).map((field) => {
                    return (
                      <Option key={field} value={field}>
                        {facetLabels[field]}
                      </Option>
                    );
                  })}
                </Select>
                <AutoComplete
                  style={{ width: `calc(100% - ${filterWidth}px)` }}
                  dataSource={dataSource.map(renderOption)}
                  onSelect={(value, option) => {
                    dispatch({ type: "search", value: option.props.text });
                  }}
                  onSearch={handleSearch}
                  optionLabelProp="text"
                  getPopupContainer={(trigger) => trigger.parentElement}
                  open={searchOpen}
                  onDropdownVisibleChange={setSearchOpen}
                >
                  <Search
                    placeholder="Type keyword to search"
                    enterButton="Search"
                    onSearch={(value) => {
                      dispatch({ type: "search", value: value });
                      setSearchOpen(false);
                    }}
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                  />
                </AutoComplete>
              </InputGroup>
              {Object.keys(param?.filters || {}).length > 0 ? (
                <FilteredTags
                  filters={param?.filters}
                  onTagClose={onChangeFacet}
                />
              ) : null}
            </div>
            {/* <div className="help">
              <Button type="link">Get help?</Button>
            </div> */}
          </div>
          {/* <div className="tag-line">
            {(facets.clusterFts || []).map((ft) => {
              return (
                <SearchSelectFacet
                  key={ft.field}
                  label={facetLabels[ft.field]}
                  field={ft.field}
                  data={ft.data}
                  onChange={(v) => onChangeFacet(v)}
                />
              );
            })}
          </div> */}
          <div className="card-cnt">
            <div className="search-result">
              <List
                itemLayout="vertical"
                size="small"
                bordered={false}
                loading={loading ? true : false}
                pagination={{
                  onChange: (page) => {
                    dispatch({ type: "pagination", value: page });
                  },
                  size: "small",
                  showSizeChanger: true,
                  pageSizeOptions: ["5", "10", "20"],
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} of ${total} items`,
                  pageSize: queryParams.size,
                  onShowSizeChange: (_, size) => {
                    dispatch({ type: "pageSizeChange", value: size });
                  },
                  total: hitsTotal,
                }}
                dataSource={hits}
                renderItem={(item) => (
                  <List.Item key={item?._id}>
                    <IndexCard
                      data={item}
                      isActive={itemDetail?._id == item?._id}
                      handleItemDetail={handleItemDetail}
                      info={infos[item?._source?.metadata?.index_id] || {}}
                      onChangeFacet={onChangeFacet}
                    />
                  </List.Item>
                )}
              />
            </div>
            <div className="search-filter">
              <div style={{ marginBottom: 10 }}>
                <Sorter
                  options={[
                    { label: "Timestamp", key: "timestamp" },
                    { label: "Index Name", key: "metadata.index_name" },
                  ]}
                  value={param?.sort || []}
                  onChange={(sv) => {
                    setParam((params) => {
                      params = params || {};
                      return {
                        ...params,
                        sort: sv,
                      };
                    });
                  }}
                />
              </div>
              <div className="facet-cnt">
                {(facets.chb || []).map((ft) => {
                  return (
                    <SearchFacet
                      key={ft.field}
                      label={facetLabels[ft.field]}
                      field={ft.field}
                      data={ft.data}
                      onChange={(v) => onChangeFacet(v)}
                      selectedKeys={param?.filters?.[ft.field] || []}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        {/* <div className="collapse">
          <span className="area" onClick={toggleCollapse}>
            <Icon type={collapse ? "right" : "left"} className="icon" />
          </span>
        </div>
        <div className="col right">
          <IndexDetail data={itemDetail} />
        </div> */}
        <Drawer
          placement="right"
          closable={true}
          zIndex={1001}
          width={640}
          onClose={() => {
            handleItemDetail({});
          }}
          visible={!!itemDetail._id}
          mask={false}
          title={
            <CardDetailTitle
              labels={[
                itemDetail._source?.metadata?.cluster_name,
                itemDetail._source?.metadata?.index_name,
              ]}
              status={
                itemDetail._source?.metadata?.labels.health_status ||
                "unavailable"
              }
            />
          }
        >
          <IndexDetail data={itemDetail} />
        </Drawer>
      </div>
    </div>
  );
};

export default (props) => {
  return (
    <QueryParamProvider ReactRouterRoute={Route}>
      <Indices {...props} />
    </QueryParamProvider>
  );
};
