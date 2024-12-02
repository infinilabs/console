import React, { PureComponent } from "react";
import { Icon, Select } from "antd";
import Link from "umi/link";
import Debounce from "lodash-decorators/debounce";
import styles from "./index.less";
import RightContent from "./RightContent";
import DropdownSelect from "./DropdownSelect";

import router from "umi/router";
import ClusterSelect from "../ClusterSelect";
const path = require("path");

export default class GlobalHeader extends PureComponent {
  constructor(props) {
    super(props);
  }

  componentDidMount() {}

  componentWillUnmount() {
    this.triggerResizeEvent.cancel();
  }

  /* eslint-disable*/
  @Debounce(600)
  triggerResizeEvent() {
    // eslint-disable-line
    const event = document.createEvent("HTMLEvents");
    event.initEvent("resize", true, false);
    window.dispatchEvent(event);
  }
  toggle = () => {
    const { collapsed, onCollapse } = this.props;
    onCollapse(!collapsed);
    this.triggerResizeEvent();
  };
  render() {
    const {
      collapsed,
      isMobile,
      logo,
      clusterVisible,
      clusterList,
      selectedCluster,
      clusterStatus,
    } = this.props;
    return (
      <div className={styles.header}>
        {isMobile && (
          <Link to="/" className={styles.logo} key="logo">
            <img src={logo} alt="logo" width="32" />
          </Link>
        )}
        {/* <Icon
          className={styles.trigger}
          type={collapsed ? "menu-unfold" : "menu-fold"}
          onClick={this.toggle}
        /> */}

        {clusterList.length > 0 && _.isObject(this.props.clusterStatus) && clusterVisible && (
          <div style={{ marginLeft: 15, display: 'inline-block'}}>
            <ClusterSelect 
              width={300}
              dropdownWidth={400}
              selectedCluster={selectedCluster} 
              clusterList={clusterList}
              clusterStatus={clusterStatus}
              onChange={(item) => {
                const rel = this.props
                  .handleSaveGlobalState({
                    selectedCluster: item,
                    selectedClusterID: item.id,
                  })
                  .then(() => {
                    const { dispatch, history } = this.props;
                    dispatch({
                      type: "global/rewriteURL",
                      payload: {
                        history,
                        pathname: history.location.pathname,
                        isChangedState: true,
                      },
                    });
                  });
              }}
            />  
          </div>
        )}
        <RightContent {...this.props} />
      </div>
    );
  }
}
