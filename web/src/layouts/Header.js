import React, { PureComponent } from "react";
import { formatMessage } from "umi/locale";
import { Layout, message } from "antd";
import Animate from "rc-animate";
import { connect } from "dva";
import router from "umi/router";
import GlobalHeader from "@/components/GlobalHeader";
import TopNavHeader from "@/components/TopNavHeader";
import styles from "./Header.less";
import Authorized from "@/utils/Authorized";
import { getSetupRequired } from "@/utils/setup";

const { Header } = Layout;
const CLUSTER_STATUS_REFRESH_INTERVAL = 60 * 1000;

class HeaderView extends PureComponent {
  state = {
    visible: true,
  };

  static getDerivedStateFromProps(props, state) {
    if (!props.autoHideHeader && !state.visible) {
      return {
        visible: true,
      };
    }
    return null;
  }

  componentDidMount() {
    document.addEventListener("scroll", this.handScroll, { passive: true });
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
    window.addEventListener("focus", this.handleWindowFocus);
    this.fetchClusterStatus({ force: true });
    this.handleNoticeVisibleChange(true);
  }

  componentWillUnmount() {
    document.removeEventListener("scroll", this.handScroll);
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    window.removeEventListener("focus", this.handleWindowFocus);
    this.clearClusterStatusTimer();
  }

  getHeadWidth = () => {
    const { isMobile, collapsed, setting } = this.props;
    const { fixedHeader, layout } = setting;
    if (isMobile || !fixedHeader || layout === "topmenu") {
      return "100%";
    }
    return collapsed ? "calc(100% - 80px)" : "calc(100% - 256px)";
  };

  handleNoticeClear = (type) => {
    message.success(
      `${formatMessage({
        id: "component.noticeIcon.cleared",
      })} ${formatMessage({ id: `component.globalHeader.${type}` })}`
    );
    const { dispatch } = this.props;
    dispatch({
      type: "global/clearNotices",
      payload: { types: [type] },
    });
  };

  handleNoticeViewMore = (type) => {
    const { dispatch } = this.props;
    router.push(`/account/notification?_g={"type":"${type}"}`);
  };

  handleMenuClick = ({ key }) => {
    const { dispatch } = this.props;
    if (key === "userCenter") {
      router.push("/account/center");
      return;
    }
    if (key === "triggerError") {
      router.push("/exception/trigger");
      return;
    }
    if (key === "userinfo") {
      router.push("/account/settings/base");
      return;
    }
    if (key === "logout") {
      dispatch({
        type: "login/logout",
      });
    }
  };

  handleNoticeVisibleChange = (visible) => {
    if (visible) {
      const { dispatch } = this.props;
      dispatch({
        type: "global/fetchNotices",
      });
    }
  };

  handScroll = () => {
    const { autoHideHeader } = this.props;
    const { visible } = this.state;
    if (!autoHideHeader) {
      return;
    }
    const scrollTop =
      document.body.scrollTop + document.documentElement.scrollTop;
    if (!this.ticking) {
      requestAnimationFrame(() => {
        if (this.oldScrollTop > scrollTop) {
          this.setState({
            visible: true,
          });
          this.scrollTop = scrollTop;
          return;
        }
        if (scrollTop > 300 && visible) {
          this.setState({
            visible: false,
          });
        }
        if (scrollTop < 300 && !visible) {
          this.setState({
            visible: true,
          });
        }
        this.oldScrollTop = scrollTop;
        this.ticking = false;
      });
    }
    this.ticking = false;
  };

  handleFetchClusterList = (name, size) => {
    const { dispatch } = this.props;
    return dispatch({
      type: "global/fetchClusterList",
      payload: {
        size,
        name,
      },
    });
  };

  handleSaveGlobalState = (newState) => {
    const { dispatch } = this.props;
    return dispatch({
      type: "global/changeClusterState",
      payload: newState,
    });
  };

  clearClusterStatusTimer = () => {
    if (this.fetchClusterStatusTimer) {
      clearTimeout(this.fetchClusterStatusTimer);
      this.fetchClusterStatusTimer = null;
    }
  };

  scheduleClusterStatusRefresh = () => {
    this.clearClusterStatusTimer();
    if (document.visibilityState === "hidden") {
      return;
    }
    this.fetchClusterStatusTimer = setTimeout(() => {
      this.fetchClusterStatus();
    }, CLUSTER_STATUS_REFRESH_INTERVAL);
  };

  handleVisibilityChange = () => {
    if (document.visibilityState === "hidden") {
      this.clearClusterStatusTimer();
      return;
    }
    this.fetchClusterStatus();
  };

  handleWindowFocus = () => {
    if (document.visibilityState === "hidden") {
      return;
    }
    this.fetchClusterStatus();
  };

  fetchClusterStatus = async ({ force = false } = {}) => {
    if (
      location.href.indexOf("/guide/initialization") !== -1 ||
      getSetupRequired() === "true" ||
      document.visibilityState === "hidden"
    ) {
      this.clearClusterStatusTimer();
      return;
    }
    const { dispatch } = this.props;
    const res = await dispatch({
      type: "global/fetchClusterStatus",
      payload: {
        force,
      },
    });
    this.clearClusterStatusTimer();
    if (!res) {
      return;
    }
    this.scheduleClusterStatusRefresh();
  };

  render() {
    const { isMobile, handleMenuCollapse, setting } = this.props;
    const { navTheme, layout, fixedHeader } = setting;
    const { visible } = this.state;
    const isTop = layout === "topmenu";
    const width = this.getHeadWidth();
    const HeaderDom = visible ? (
      <Header
        style={{ padding: 0, width }}
        className={fixedHeader ? styles.fixedHeader : ""}
      >
        {isTop && !isMobile ? (
          <TopNavHeader
            theme={navTheme}
            mode="horizontal"
            Authorized={Authorized}
            onCollapse={handleMenuCollapse}
            onNoticeClear={this.handleNoticeClear}
            onNoticeViewMore={this.handleNoticeViewMore}
            onMenuClick={this.handleMenuClick}
            onNoticeVisibleChange={this.handleNoticeVisibleChange}
            {...this.props}
          />
        ) : (
          <GlobalHeader
            onCollapse={handleMenuCollapse}
            onNoticeClear={this.handleNoticeClear}
            onNoticeViewMore={this.handleNoticeViewMore}
            onMenuClick={this.handleMenuClick}
            onNoticeVisibleChange={this.handleNoticeVisibleChange}
            onFetchClusterList={this.handleFetchClusterList}
            handleSaveGlobalState={this.handleSaveGlobalState}
            {...this.props}
          />
        )}
      </Header>
    ) : null;
    return (
      <Animate component="" transitionName="fade">
        {HeaderDom}
      </Animate>
    );
  }
}

export default connect(({ user, global, setting, loading }) => ({
  currentUser: user.currentUser,
  collapsed: global.collapsed,
  fetchingNotices: loading.effects["global/fetchNotices"],
  notices: global.notices,
  setting,
  clusterVisible: global.clusterVisible,
  clusterList: global.clusterList,
  selectedCluster: global.selectedCluster,
  clusterStatus: global.clusterStatus,
}))(HeaderView);
