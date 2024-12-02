import { Button, Dropdown, List, Spin, message, Icon, Input } from "antd";
import React from "react";
import InfiniteScroll from "react-infinite-scroller";
import styles from "./DropdownSelect.less";
import _ from "lodash";
import { DropdownItem } from "./DropdownItem";
import { formatMessage } from "umi/locale";

class DropdownSelectCommon extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: props.defaultValue,
      loading: false,
      hasMore: props.data.length > props.size,
      overlayVisible: false,
      data: (props.data || []).slice(0, props.size),
      dataSource: [...props.data],
      selectedIndex: -1,
      disabled: props.disabled || false,
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
    if (preProps.data.length != preState.dataSource.length) {
      const newData = [...preProps.data];
      this.setState({
        dataSource: newData,
        data: newData,
        hasMore: newData.length > this.props.size,
        selectedIndex: -1,
      });
    }
  }
  handleInfiniteOnLoad = (current) => {
    // console.log("handleInfiniteOnLoad current:", current);
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
    const newData = this.props.data.filter((item) => {
      return item.name.includes(name);
    });
    this.setState({
      displayValue: name,
      dataSource: newData,
      data: newData,
      hasMore: newData.length > this.props.size,
    });
  };
  selectOffset = (offset) => {
    let { selectedIndex, data } = this.state;
    const len = data.length;
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

  render() {
    const { labelField } = this.props;
    let value = this.props.value || this.state.value;
    let displayVaue = value[labelField];
    const menu = (
      <div className={styles.dropmenu} style={{ width: this.props.width }}>
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
              style={{ outline: "none" }}
              onChange={this.handleInputChange}
              placeholder={"Type keyword to filter"}
              value={this.state.displayValue || ""}
              ref={(ref) => {
                this.searchInputRef = ref;
              }}
            />
            <Button type="primary">New Tab</Button>
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
                  No data match
                </div>
              )}
              {(this.state.data || []).map((item, idx) => {
                return (
                  // <div className={styles.item} key={idx}>
                  //   <Button
                  //     key={item[labelField]}
                  //     onClick={() => {
                  //       this.handleItemClick(item);
                  //     }}
                  //     className={
                  //       _.isEqual(item, value)
                  //         ? styles.btnitem + " " + styles.selected
                  //         : styles.btnitem
                  //     }
                  //   >
                  //     {item[labelField]}
                  //   </Button>
                  // </div>
                  <div
                    key={idx}
                    className={styles["dropdown-item"]}
                    onClick={() => {
                      this.handleItemClick(item);
                    }}
                  >
                    <div className={styles["wrapper"]}>
                      <span className={styles["name"]}>
                        {" "}
                        {item[labelField]}
                      </span>
                      {/* <div className={styles["version"]}>{clusterItem?.version}</div> */}
                    </div>
                  </div>
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

    return this.props.visible ? (
      <Dropdown
        disabled={this.state.disabled}
        overlay={menu}
        placement="bottomLeft"
        visible={this.state.overlayVisible}
        onVisibleChange={(flag) => {
          this.setState({ overlayVisible: flag });
        }}
      >
        {this.props.children}
      </Dropdown>
    ) : (
      ""
    );
  }
}

export default DropdownSelectCommon;
