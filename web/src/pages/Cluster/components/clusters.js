import {
  Input,
  Icon,
  List,
  Card,
  Button,
  AutoComplete,
  Select,
  Drawer,
} from "antd";
import React, { useState, useMemo, useRef } from "react";

import useFetch from "@/lib/hooks/use_fetch";
import { ESPrefix } from "@/services/common";
import "./clusters.scss";
import ClusterDetail from "./cluster_detail";
import { TagList } from "./tag";
import ClusterCard from "./cluster_card";
import { CardDetailTitle } from "./detail/card_detail_title";
import request from "@/utils/request";
import {
  buildSearchAggs,
  buildSearchFilter,
  buildSearchHighlight,
  getSearchFacets,
} from "@/lib/elasticsearch/search";
import { formatESSearchResult } from "@/lib/elasticsearch/util";
import SearchFacet from "./search_facet";
import { FilteredTags } from "./filtered_tags";
import { JsonParam, useQueryParam } from "use-query-params";
import { HealthStatusCircle } from "@/components/infini/health_status_circle";
import Sorter from "@/components/infini/search/sort/sort";

const { Search } = Input;
const InputGroup = Input.Group;
const Option = Select.Option;
const filterWidth = 120;

const facetLabels = {
  "labels.health_status": "health status",
  version: "version",
  tags: "tags",
};
const aggsParams = [
  { field: "version", params: { size: 100 } },
  { field: "labels.health_status", params: { size: 150 } },
  { field: "tags", params: { size: 150 } },
];

const Clusters = (props) => {
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
  const { loading, error, value } = useFetch(
    `${ESPrefix}/cluster/_search`,
    {
      method: "POST",
      body: {
        ...queryParams,
        aggs: aggsParams,
        highlight: {
          fields: ["name", "host"],
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

  const fetchFilterAggs = async () => {
    const res = await request(`${ESPrefix}/cluster/_search`, {
      method: "POST",
      body: {
        size: 0,
        aggs: aggsParams,
      },
    });
    if (res?.aggregations) {
      const fts = getSearchFacets(res, Object.keys(facetLabels));
      if (fts.length > 0) {
        setFacets(fts);
      }
    }
  };

  const hits = value?.hits?.hits || [];
  const [infos, setInfos] = useState({});
  const [facets, setFacets] = useState([]);
  React.useEffect(() => {
    if (hits?.length == 0) {
      return;
    }

    const fetchClusterInfo = async () => {
      const clusterIDs = hits?.map((hit) => hit._id);
      if (!clusterIDs || clusterIDs.length == 0) {
        return;
      }
      const res = await request(`${ESPrefix}/cluster/info`, {
        method: "POST",
        body: clusterIDs,
      });
      if (res) {
        setInfos(res);
      }
    };
    fetchClusterInfo();
  }, [value]);

  React.useEffect(() => {
    if (isInitRef.current === false) {
      isInitRef.current = true;
    }
    if (!param?.filters) {
      setParam({ ...param, filters: initialParams.filters });
    }

    fetchFilterAggs();
  }, []);

  const hitsTotal = value?.hits?.total?.value || 0;

  const [itemDetail, setItemDetail] = React.useState({});
  const handleItemDetail = (item) => {
    setItemDetail(item);
  };

  function searchResult(keyword) {
    return request(`/elasticsearch/cluster/_search`, {
      method: "POST",
      body: {
        size: 10,
        keyword,
        highlight: {
          fields: ["name", "host", "version"],
          fragment_size: 200,
          number_of_fragment: 1,
        },
      },
    });
  }

  function renderOption(item) {
    const name = item.highlight?.name || item._source?.name;
    const host = item.highlight?.host || item._source?.host;
    const version = item.highlight?.version || item._source?.version;
    return (
      <Select.Option key={item._id} text={item._source?.name}>
        <div className="suggest-item">
          <div className="suggest-line">
            <div>
              <HealthStatusCircle status={item._source.labels?.health_status} />
              <span
                className="title"
                dangerouslySetInnerHTML={{ __html: name }}
              />
              &nbsp;&nbsp;(
              <span dangerouslySetInnerHTML={{ __html: version }} />)
            </div>
            <div className="right">
              <span dangerouslySetInnerHTML={{ __html: host }} />
            </div>
          </div>
          <div>
            <div className="suggest-tag-list">
              {(item._source?.tags || []).map((tag, i) => {
                return (
                  <div key={i} className="suggest-tag">
                    {tag}
                  </div>
                );
              })}
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
    const res = await searchResult(value);
    if (res) {
      setDataSrouce(res?.hits?.hits || []);
    }
  };
  const [searchOpen, setSearchOpen] = useState(false);
  const [sort, setSort] = useState({});

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
            <TagList
              value={[
                { text: "Green" },
                { text: "Yellow" },
                { text: "Red" },
                { text: "7.9.2", checked: false },
              ]}
            />
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
                  total: hitsTotal,
                  onShowSizeChange: (_, size) => {
                    dispatch({ type: "pageSizeChange", value: size });
                  },
                }}
                dataSource={hits}
                renderItem={(item) => (
                  <List.Item key={item?._id}>
                    <ClusterCard
                      data={item}
                      info={infos[item._id] || {}}
                      isActive={itemDetail?._id == item?._id}
                      handleItemDetail={handleItemDetail}
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
                    { label: "Timestamp", key: "updated" },
                    { label: "Cluster Name", key: "name" },
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
                {facets.map((ft) => {
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
        </div> */}
      </div>
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
            labels={[itemDetail._source?.name, itemDetail._source?.version]}
            status={itemDetail._source?.labels?.health_status || "unavailable"}
          />
        }
      >
        <ClusterDetail data={itemDetail} />
      </Drawer>
    </div>
  );
};

export default Clusters;
