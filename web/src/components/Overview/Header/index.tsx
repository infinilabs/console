import { HealthStatusCircle } from "@/components/infini/health_status_circle";
import request from "@/utils/request";
import { AutoComplete, Input, Select, Button, Radio, Icon } from "antd";
import { Fragment, useState } from "react";
import Filters from "./Filters";
import styles from "./index.scss";
import CardViewSvg from "@/components/Icons/CardView";
import TableViewSvg from "@/components/Icons/TableView";

const ButtonGroup = Button.Group;
const filterWidth = 120;

interface IProps {
  searchField?: string;
  filters: any;
  selectFilterLabels: { [key: string]: string };
  onSearchFieldChange: (field: string) => void;
  onSearchChange: (value: string) => void;
  onFacetChange: (value: any) => void;
  dispalyType?: string;
  onDisplayTypeChange: (value: string) => void;
  autoCompleteConfig: {
    action: string;
    highlightFields: string[];
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
  getExtra?: (props: any) => React.ReactNode[];
}

export default (props: IProps) => {
  const {
    searchField,
    filters,
    selectFilterLabels,
    onSearchFieldChange,
    onSearchChange,
    onFacetChange,
    dispalyType,
    onDisplayTypeChange,
    autoCompleteConfig: {
      action,
      highlightFields,
      showStatus = false,
      showTags = false,
      getOptionMeta,
    },
    getExtra,
  } = props;

  const [searchValue, setSearchValue] = useState("");

  const [dataSource, setDataSrouce] = useState([]);

  const [searchOpen, setSearchOpen] = useState(false);

  function renderOption(item) {
    const { title, desc, right, tags, status } = getOptionMeta(item);
    return (
      <Select.Option key={item._id} text={item._source?.name}>
        <div className="suggest-item">
          <div className="suggest-line">
            <div>
              {status && showStatus && <HealthStatusCircle status={status} />}
              <span
                className="title"
                dangerouslySetInnerHTML={{ __html: title }}
              />
              &nbsp;&nbsp;
              <span dangerouslySetInnerHTML={{ __html: desc }} />
            </div>
            {right && (
              <div className="right">
                <span dangerouslySetInnerHTML={{ __html: right }} />
              </div>
            )}
          </div>
          {showTags && (
            <div>
              <div className="suggest-tag-list">
                {(tags || []).map((tag, i) => {
                  return (
                    <div key={i} className="suggest-tag">
                      {tag}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Select.Option>
    );
  }

  const handleSearch = async (value) => {
    if (!value) {
      setDataSrouce([]);
      return;
    }
    const res = await request(action, {
      method: "POST",
      body: {
        size: 10,
        keyword: value,
        highlight: {
          fields: highlightFields,
          fragment_size: 200,
          number_of_fragment: 1,
        },
      },
    });
    if (res) {
      setDataSrouce(res?.hits?.hits || []);
    }
  };

  const extra = getExtra ? getExtra(props) : [];

  const handleDisplayTypeChange = (e) => {
    onDisplayTypeChange(e.target.value);
  };

  const activeColor = "#1890ff";

  return (
    <>
      <div className={styles.searchLine}>
        <div className={styles.searchBox}>
          <Radio.Group
            value={dispalyType}
            onChange={handleDisplayTypeChange}
            className={styles.buttonGroup}
          >
            <Radio.Button value="card">
              <Icon
                component={CardViewSvg}
                style={{
                  fontSize: 18,
                  color: dispalyType == "card" ? activeColor : "",
                }}
              />
            </Radio.Button>
            <Radio.Button value="table">
              <Icon
                component={TableViewSvg}
                style={{
                  fontSize: 18,
                  color: dispalyType == "table" ? activeColor : "",
                }}
              />
            </Radio.Button>
          </Radio.Group>
          <Input.Group compact>
            <Select
              allowClear={true}
              style={{ width: filterWidth }}
              dropdownMatchSelectWidth={false}
              placeholder="Filters"
              onChange={onSearchFieldChange}
              value={searchField}
            >
              {Object.keys(selectFilterLabels).map((field) => {
                return (
                  <Select.Option key={field} value={field}>
                    {selectFilterLabels[field]}
                  </Select.Option>
                );
              })}
            </Select>
            <AutoComplete
              style={{ width: `calc(100% - ${filterWidth}px)` }}
              dataSource={dataSource.map(renderOption)}
              onSelect={(value, option) => onSearchChange(option.props.text)}
              onSearch={handleSearch}
              optionLabelProp="text"
              getPopupContainer={(trigger) => trigger.parentElement}
              open={searchOpen}
              onDropdownVisibleChange={setSearchOpen}
            >
              <Input.Search
                placeholder="Type keyword to search"
                enterButton="Search"
                onSearch={(value) => {
                  onSearchChange(value);
                  setSearchOpen(false);
                }}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </AutoComplete>
          </Input.Group>
        </div>
        <div>
          {extra.map((item, index) => (
            <Fragment key={index}>{item}</Fragment>
          ))}
        </div>
      </div>
      <Filters filters={filters} onTagClose={onFacetChange} />
    </>
  );
};
