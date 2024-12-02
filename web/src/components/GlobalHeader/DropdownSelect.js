import {
  Button,
  Dropdown,
  List,
  Spin,
  message,
  Icon,
  Input,
  Switch,
} from "antd";
import React from "react";
import InfiniteScroll from "react-infinite-scroller";
import styles from "./DropdownSelect.less";
import _ from "lodash";
import { DropdownItem } from "./DropdownItem";
import { HealthStatusCircle } from "@/components/infini/health_status_circle";
import { formatMessage } from "umi/locale";

class DropdownSelect extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: props.defaultValue,
      loading: false,
      hasMore: props.data.length > props.size,
      overlayVisible: false,
      data: this.getFilterData("", false).slice(0, props.size),
      dataSource: [...props.data],
      selectedIndex: -1,
      disabled: props.disabled || false,
      showUnavailable: false,
    };
  }

  handleItemClick = (item) => {
    let preValue = this.props.value || this.state.value;
    this.setState(
      {
        value: item,
        overlayVisible: false,
      },
      () => {
        let onChange = this.props.onChange;
        if (preValue != item && onChange && typeof onChange == "function") {
          onChange(item);
        }
      }
    );
  };

  componentDidMount() {}
  componentDidUpdate(preProps, preState) {
    if (preProps.data.length != this.props.data.length) {
      const newData = this.getFilterData("", false, this.props.data);

      this.setState((st) => {
        return {
          ...st,
          data: newData.slice(0, this.props.size),
          dataSource: newData,
          hasMore: newData.length > this.props.size,
          selectedIndex: -1,
        };
      });
    }
  }
  handleInfiniteOnLoad = (current) => {
    let { size } = this.props;
    let targetLength = current * size;
    let { hasMore, dataSource } = this.state;
    if (dataSource.length < targetLength) {
      targetLength = dataSource.length;
      hasMore = false;
    }
    const newData = this.state.dataSource.slice(0, targetLength);

    this.setState({
      data: newData,
      hasMore: hasMore,
    });
  };

  handleInputChange = (e) => {
    const name = e.target.value;
    const newData = this.getFilterData(name, this.state.showUnavailable);
    this.setState((state) => {
      return {
        ...state,
        displayValue: name,
        dataSource: newData,
        data: newData,
        hasMore: newData.length > this.props.size,
      };
    });
  };
  selectOffset = (offset) => {
    let { selectedIndex, filterData } = this.state;
    const len = filterData.length;
    selectedIndex = (selectedIndex + offset + len) % len;
    this.setState({
      selectedIndex,
    });
  };

  onKeyDown = (e) => {
    const { which } = e;
    switch (which) {
      case 38:
        this.selectOffset(-1);
        e.preventDefault();
        e.stopPropagation();
        break;
      case 40:
        this.selectOffset(1);
        e.stopPropagation();
        break;
      case 13:
        const { data, selectedIndex } = this.state;
        if (selectedIndex > -1) {
          this.handleItemClick(data[selectedIndex]);
          this.setState({ overlayVisible: false });
        }
        break;
    }
  };
  getFilterData = (keyword, showUnavailable, ds) => {
    const { clusterStatus } = this.props;
    const filterData = (ds || this.props.data || [])
      .sort((a, b) => {
        if (
          clusterStatus[a.id]?.available == true &&
          clusterStatus[b.id]?.available == true
        ) {
          return 0;
        }
        if (clusterStatus[a.id]?.available == true) {
          return -1;
        }
        return 1;
      })
      .filter((item) => {
        const cstatus = clusterStatus ? clusterStatus[item.id] : null;
        if (
          (cstatus == null || cstatus.available == false) &&
          !showUnavailable
        ) {
          return false;
        }
        if (keyword) {
          return item.name.includes(keyword);
        }
        return true;
      });
    return filterData;
  };

  onAvailableChange = (v) => {
    this.setState((state) => {
      const filterData = this.getFilterData(this.state.displayValue, v);
      return {
        ...state,
        showUnavailable: v,
        dataSource: filterData,
        data: filterData,
        selectedIndex: -1,
      };
    });
  };

  render() {
    const { labelField, clusterStatus } = this.props;
    let value = this.props.value || this.state.value;
    let displayVaue = value[labelField];

    const menu = (
      <div className={styles.dropmenu}>
        <div
          className={styles.infiniteContainer}
          style={{ height: this.props.height }}
          onMouseEnter={() => {
            this.searchInputRef.focus();
          }}
          onKeyDown={this.onKeyDown}
        >
          <div
            className={styles.filter}
            style={{ paddingTop: 10, paddingBottom: 0 }}
          >
            <input
              className={styles["btn-ds"]}
              style={{ outline: "none", width: this.props.width || "300px" }}
              onChange={this.handleInputChange}
              placeholder={formatMessage({
                id: "console.cluster.select.placeholder",
              })}
              value={this.state.displayValue || ""}
              ref={(ref) => {
                this.searchInputRef = ref;
              }}
            />
            <div style={{ marginLeft: "auto", marginRight: 10, marginTop: 5 }}>
              <Switch onChange={this.onAvailableChange} /> Show Unavailable
            </div>
          </div>
          <InfiniteScroll
            initialLoad={false}
            loadMore={this.handleInfiniteOnLoad}
            hasMore={!this.state.loading && this.state.hasMore}
            useWindow={false}
          >
            <div className={styles.dslist}>
              {(!this.state.data || !this.state.data.length) && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: 50,
                  }}
                >
                  {formatMessage({
                    id: "console.cluster.select.search.no_match",
                  })}
                </div>
              )}
              {(this.state.data || []).map((item, idx) => {
                // return  <div className={styles.item}>
                //           <Button key={item[labelField]}
                //           onClick={() => {
                //             this.handleItemClick(item)
                //           }}
                //           className={_.isEqual(item, value) ? styles.btnitem + " " + styles.selected : styles.btnitem}>{item[labelField]}</Button>
                //         </div>
                const cstatus = clusterStatus ? clusterStatus[item.id] : null;

                return (
                  <DropdownItem
                    key={item.id}
                    clusterItem={item}
                    isSelected={this.state.selectedIndex == idx}
                    clusterStatus={cstatus}
                    onClick={() => {
                      this.handleItemClick(item);
                    }}
                  />
                );
              })}
            </div>
          </InfiniteScroll>
        </div>
        {!this.state.loading && this.state.hasMore && (
          <div style={{ textAlign: "center", marginTop: 10, color: "#ccc" }}>
            pull load more
          </div>
        )}
      </div>
    );
    const cstatus = clusterStatus ? clusterStatus[value?.id] : null;
    return this.props.visible ? (
      <Dropdown
        disabled={this.state.disabled}
        overlay={menu}
        placement="bottomLeft"
        visible={this.state.overlayVisible}
        onVisibleChange={(flag) => {
          this.setState({ overlayVisible: flag });
        }}
        style={{
          width: this.props.width || "300px",
        }}
      >
        {/* <Button className={styles['btn-ds']}>{value[labelField]} <Icon style={{float: 'right', marginTop: 3}}
                                                                          type="caret-down"/></Button> */}
        <span
          style={{
            position: "relative",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          <i
            style={{ position: "absolute", left: 18, zIndex: 10, marginTop: 3 }}
          >
            <HealthStatusCircle
              status={
                cstatus?.available ? cstatus?.health?.status : "unavailable"
              }
            />
          </i>
          <input
            className={styles["btn-ds"]}
            style={{
              outline: "none",
              paddingLeft: 22,
              width: this.props.width || "300px",
            }}
            value={value[labelField]}
            readOnly={true}
            disabled={this.state.disabled}
          />
          <Icon style={{ position: "absolute", right: -4 }} type="caret-down" />
        </span>
      </Dropdown>
    ) : (
      ""
    );
  }
}

export default DropdownSelect;
