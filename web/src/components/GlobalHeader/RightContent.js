import React, { PureComponent } from "react";
import { FormattedMessage, formatMessage } from "umi/locale";
import { getWebsitePathByLang } from "@/utils/utils";
import { Spin, Tag, Menu, Icon, Dropdown, Avatar, Tooltip } from "antd";
import moment from "moment";
import groupBy from "lodash/groupBy";
import NoticeIcon from "../NoticeIcon";
import HeaderSearch from "../HeaderSearch";
import SelectLang from "../SelectLang";
import styles from "./index.less";
import { ConsoleUI } from "@/pages/DevTool/Console";
import { Resizable } from "re-resizable";
import { ResizeBar } from "@/components/infini/resize_bar";
import defaultAvatar from "@/assets/icon.png";
import { getAuthEnabled, hasAuthority } from "@/utils/authority";
import TimezoneSelect from "@/components/infini/TimezoneSelect";
import { TimezoneIcon } from "@/components/infini/Icons";
import DiscordSvg from "@/components/Icons/Discord";
import EmptyNoticeSvg from "@/assets/emptyNotice.svg";
import EmptyTodoSvg from "@/assets/emptyTodo.svg";
import router from "umi/router";

export default class GlobalHeaderRight extends PureComponent {
  state = { consoleVisible: false, notificationPopupVisible: false };
  getNoticeData() {
    const { notices = [] } = this.props;
    if (notices.length === 0) {
      return {};
    }
    const newNotices = notices.map((notice) => {
      const newNotice = { ...notice };
      if (newNotice.datetime) {
        newNotice.datetime = moment(notice.datetime).fromNow();
      }
      if (newNotice.id) {
        newNotice.key = newNotice.id;
      }
      return newNotice;
    });
    return groupBy(newNotices, "type");
  }
  setConsoleVisible = (visible) => {
    this.setState({
      consoleVisible: visible,
    });
    var sl = document.querySelector("#root>div");
    if (sl) {
      sl.style.paddingBottom = "0px";
    }
  };
  onKeyDown = (e) => {
    const { keyCode } = e;
    if (this.keysPressed["17"] && this.keysPressed["16"] && keyCode == 79) {
      if (this.state.consoleVisible) document.body.style.overflow = "";
      this.setConsoleVisible(!this.state.consoleVisible);
      return true;
    }
    this.keysPressed[keyCode] = e.type == "keydown";
    return false;
  };
  onKeyUp = (e) => {
    const { keyCode } = e;
    delete this.keysPressed[keyCode];
  };
  constructor(props) {
    super(props);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
  }
  componentDidMount() {
    this.keysPressed = {};
    document.addEventListener("keydown", this.onKeyDown, false);
    document.addEventListener("keyup", this.onKeyUp, false);
  }
  componentWillUnmount() {
    document.removeEventListener("keydown", this.onKeyDown);
    document.removeEventListener("keyup", this.onKeyUp);
  }

  render() {
    const {
      currentUser,
      fetchingNotices,
      onNoticeVisibleChange,
      onMenuClick,
      onNoticeClear,
      onNoticeViewMore,
      theme,
    } = this.props;
    const menu = (
      <Menu className={styles.menu} selectedKeys={[]} onClick={onMenuClick}>
        {/* <Menu.Item key="userinfo">
          <Icon type="setting" />
          <FormattedMessage
            id="menu.account.settings"
            defaultMessage="account settings"
          />
        </Menu.Item> */}
        {/* <Menu.Item key="userCenter">
          <Icon type="user" />
          <FormattedMessage
            id="menu.account.center"
            defaultMessage="account center"
          />
        </Menu.Item>
        <Menu.Item key="userinfo">
          <Icon type="setting" />
          <FormattedMessage
            id="menu.account.settings"
            defaultMessage="account settings"
          />
        </Menu.Item>
        <Menu.Item key="triggerError">
          <Icon type="close-circle" />
          <FormattedMessage
            id="menu.account.trigger"
            defaultMessage="Trigger Error"
          />
        </Menu.Item>
        <Menu.Divider /> */}
        <Menu.Item key="logout">
          <Icon type="logout" />
          <FormattedMessage id="menu.account.logout" defaultMessage="logout" />
        </Menu.Item>
      </Menu>
    );
    const noticeData = this.getNoticeData();
    let className = styles.right;
    if (theme === "dark") {
      className = `${styles.right}  ${styles.dark}`;
    }
    const hasDevtoolPrivilege =
      hasAuthority("devtool.console:all") ||
      hasAuthority("devtool.console:read");

    return (
      <div className={className}>
        {/* <HeaderSearch
          className={`${styles.action} ${styles.search}`}
          placeholder={formatMessage({ id: 'component.globalHeader.search' })}
          dataSource={[
            formatMessage({ id: 'component.globalHeader.search.example1' }),
            formatMessage({ id: 'component.globalHeader.search.example2' }),
            formatMessage({ id: 'component.globalHeader.search.example3' }),
          ]}
          onSearch={value => {
            console.log('input', value); // eslint-disable-line
          }}
          onPressEnter={value => {
            console.log('enter', value); // eslint-disable-line
          }}
        /> */}

        <Tooltip title={"Discord"}>
          <a
            className={styles.action}
            href={"https://discord.com/invite/4tKTMkkvVX"}
            target="_blank"
          >
            <Icon component={DiscordSvg} style={{ fontSize: 18 }} />
          </a>
        </Tooltip>

        <Dropdown overlay={<TimezoneSelect />}>
          <a className={styles.action} onClick={(e) => e.preventDefault()}>
            <TimezoneIcon />
          </a>
        </Dropdown>
        {hasDevtoolPrivilege ? (
          <a
            className={styles.action}
            onClick={() => {
              const { history, selectedCluster } = this.props;
              this.setConsoleVisible(!this.state.consoleVisible);
            }}
          >
            {" "}
            <Icon type="code" />
          </a>
        ) : null}
        {APP_OFFICIAL_WEBSITE ? (
          <Dropdown
            overlay={
              <Menu className={styles.menu}>
                <Menu.Item key="website">
                  <a href={getWebsitePathByLang()} target="_blank">
                    <Icon type="home" />
                    <FormattedMessage id="menu.header.help.official_website" />
                  </a>
                </Menu.Item>
                <Menu.Item key="release_notes">
                  <a
                    href={`${getWebsitePathByLang()}/docs/latest/console/release-notes`}
                    target="_blank"
                  >
                    <Icon type="sync" />
                    <FormattedMessage id="menu.header.help.release_notes" />
                  </a>
                </Menu.Item>
                <Menu.Item key="document">
                  <a
                    href={`${getWebsitePathByLang()}/docs/latest/console/`}
                    target="_blank"
                  >
                    <Icon type="read" />
                    <FormattedMessage id="menu.header.help.document" />
                  </a>
                </Menu.Item>
                <Menu.Item key="ticket">
                  <a
                    href={`https://github.com/infinilabs/console/issues/new`}
                    target="_blank"
                  >
                    <Icon type="github" />
                    <FormattedMessage id="menu.header.help.ticket" />
                  </a>
                </Menu.Item>
              </Menu>
            }
          >
            <a className={styles.action} onClick={(e) => e.preventDefault()}>
              <Icon type="question-circle" />
            </a>
          </Dropdown>
        ) : null}

        <NoticeIcon
          className={styles.action}
          count={currentUser.notifyCount}
          onItemClick={(item, tabProps) => {
            // console.log(item, tabProps); // eslint-disable-line
            const { dispatch } = this.props;
            dispatch({
              type: "global/clearNotices",
              payload: { ids: [item.id], type: item.type },
            });
            router.push(
              `/account/notification?_g={"type":"${item.type}","id":"${item.id}"}`
            );
          }}
          locale={{
            emptyText: formatMessage({ id: "component.noticeIcon.empty" }),
            clear: formatMessage({ id: "component.noticeIcon.clear" }),
            viewMoreText: formatMessage({
              id: "component.noticeIcon.viewMoreText",
            }),
          }}
          onClear={onNoticeClear}
          onViewMore={(tab) => {
            onNoticeViewMore(tab.name);
            this.setState({
              notificationPopupVisible: false,
            });
          }}
          onPopupVisibleChange={(visible) => {
            onNoticeVisibleChange(visible);
            this.setState({
              notificationPopupVisible: visible,
            });
          }}
          popupVisible={this.state.notificationPopupVisible}
          loading={fetchingNotices}
          popupAlign={{ offset: [20, -16] }}
        >
          <NoticeIcon.Tab
            list={noticeData.notification}
            title={formatMessage({ id: "component.globalHeader.notification" })}
            name="notification"
            emptyText={formatMessage({
              id: "component.globalHeader.notification.empty",
            })}
            emptyImage={EmptyNoticeSvg}
          />
          <NoticeIcon.Tab
            list={noticeData.todo}
            title={formatMessage({ id: "component.globalHeader.todo" })}
            name="todo"
            emptyText={formatMessage({
              id: "component.globalHeader.todo.empty",
            })}
            emptyImage={EmptyTodoSvg}
          />
        </NoticeIcon>

        <a className={styles.action}>
          <SelectLang />
        </a>
        {getAuthEnabled() === "true" && currentUser.name ? (
          <Dropdown overlay={menu}>
            <span className={`${styles.action} ${styles.account}`}>
              <Avatar
                size="small"
                className={styles.avatar}
                src={currentUser.avatar ? currentUser.avatar : defaultAvatar}
                alt="avatar"
              />
              <span className={styles.name}>
                {currentUser.nick_name || currentUser.name}
              </span>
            </span>
          </Dropdown>
        ) : getAuthEnabled() === "true" ? (
          <Spin size="small" style={{ marginLeft: 8, marginRight: 8 }} />
        ) : null}

        {hasDevtoolPrivilege && this.state.consoleVisible ? (
          <div
            style={{
              borderTop: "solid 1px #ddd",
              background: "#fff",
              position: "fixed",
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1002,
            }}
          >
            {/* <Resizable
            defaultSize={{
              height: '50vh'
            }}
            minHeight={200}
            maxHeight="100vh"
            handleComponent={{ top: <ResizeBar/> }}
            enable={{
              top: true,
              right: false,
              bottom: false,
              left: false,
              topRight: false,
              bottomRight: false,
              bottomLeft: false,
              topLeft: false,
            }}> */}
            {this.props.clusterList.length > 0 &&
              this.props.selectedCluster.id != "" && (
                <ConsoleUI
                  selectedCluster={this.props.selectedCluster}
                  clusterList={this.props.clusterList}
                  visible={false}
                  minimize={true}
                  onMinimizeClick={() => {
                    this.setConsoleVisible(false);
                  }}
                  clusterStatus={this.props.clusterStatus}
                  resizeable={true}
                />
              )}
          </div>
        ) : null}
      </div>
    );
  }
}
