import { Input, Icon, List, Card, Button } from "antd";
import React from "react";

import useFetch from "@/lib/hooks/use_fetch";
import { ESPrefix } from "@/services/common";
import "../clusters.scss";
import HostDetail from "./host_detail";
import { TagList } from "../tag";
import HostCard from "./host_card";

const { Search } = Input;

const Hosts = (props) => {
  const [collapse, setCollapse] = React.useState(false);
  const toggleCollapse = () => {
    setCollapse(!collapse);
  };
  const [searchValue, setSearchValue] = React.useState("");

  const initialQueryParams = {
    from: 0,
    size: 5,
    keyword: "",
  };
  function reducer(queryParams, action) {
    console.log("action", action);
    switch (action.type) {
      case "search":
        return { ...queryParams, keyword: action.value };
      case "pagination":
        return {
          ...queryParams,
          from: (action.value - 1) * initialQueryParams.size,
        };
      default:
        throw new Error();
    }
  }
  const [queryParams, dispatch] = React.useReducer(reducer, initialQueryParams);

  const { loading, error, value } = useFetch(
    `${ESPrefix}/host/_search`,
    {
      queryParams: queryParams,
    },
    [queryParams]
  );

  const hits = value?.hits?.hits || [];
  const hitsTotal = value?.hits?.total?.value || 0;

  const [itemDetail, setItemDetail] = React.useState({});
  const handleItemDetail = (item) => {
    setItemDetail(item);
  };

  React.useEffect(() => {
    setItemDetail(hits?.[0]);
  }, [hits]);

  return (
    <div className="clusters">
      <div className="wrapper">
        <div className={"col left" + (collapse ? " collapse" : "")}>
          <div className="search-line">
            <div className="search-box">
              <Search
                placeholder="search"
                enterButton="Search"
                onSearch={(value) => dispatch({ type: "search", value: value })}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>
            <div className="help">
              <Button type="link">Get help?</Button>
            </div>
          </div>
          <div className="tag-line">
            <TagList
              value={[
                { text: "Green" },
                { text: "Yellow" },
                { text: "Red" },
                { text: "北京", checked: false },
              ]}
            />
          </div>
          <div className="card-cnt">
            <List
              itemLayout="vertical"
              size="small"
              bordered={false}
              loading={loading ? true : false}
              pagination={{
                onChange: (page) => {
                  dispatch({ type: "pagination", value: page });
                },
                showSizeChanger: true,
                pageSizeOptions: ["5", "10", "20"],
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} items`,
                pageSize: initialQueryParams.size,
                total: hitsTotal,
              }}
              dataSource={hits}
              renderItem={(item) => (
                <List.Item key={item?._id}>
                  <HostCard
                    data={item}
                    isActive={itemDetail?._id == item?._id}
                    handleItemDetail={handleItemDetail}
                  />
                </List.Item>
              )}
            />
          </div>
        </div>
        <div className="collapse">
          <span className="area" onClick={toggleCollapse}>
            <Icon type={collapse ? "right" : "left"} className="icon" />
          </span>
        </div>
        <div className="col right">
          <HostDetail data={itemDetail} />
        </div>
      </div>
    </div>
  );
};

export default Hosts;
