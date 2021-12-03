import React, { PureComponent } from "react";
import { FormattedMessage, formatMessage } from "umi/locale";
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

export default class GlobalHeaderRight extends PureComponent {
  state = { consoleVisible: false };
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
      if (newNotice.extra && newNotice.status) {
        const color = {
          todo: "",
          processing: "blue",
          urgent: "red",
          doing: "gold",
        }[newNotice.status];
        newNotice.extra = (
          <Tag color={color} style={{ marginRight: 0 }}>
            {newNotice.extra}
          </Tag>
        );
      }
      return newNotice;
    });
    return groupBy(newNotices, "type");
  }
  onKeyDown = (e) => {
    const { keyCode } = e;
    if (this.keysPressed["17"] && this.keysPressed["16"] && keyCode == 79) {
      this.setState({
        consoleVisible: !this.state.consoleVisible,
      });
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
      theme,
    } = this.props;
    const menu = (
      <Menu className={styles.menu} selectedKeys={[]} onClick={onMenuClick}>
        <Menu.Item key="userCenter">
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
        <Menu.Divider />
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

        <a
          className={styles.action}
          onClick={() => {
            const { history, selectedCluster } = this.props;
            // history.push(`/dev_tool`);
            this.setState({
              consoleVisible: !this.state.consoleVisible,
            });
          }}
        >
          {" "}
          <Icon type="code" />
        </a>
        <a
          className={styles.action}
          target="_blank"
          href="https://www.infinilabs.com"
        >
          {" "}
          <Icon type="question-circle" />
        </a>

        {/* <NoticeIcon
          className={styles.action}
          count={currentUser.notifyCount}
          onItemClick={(item, tabProps) => {
            console.log(item, tabProps); // eslint-disable-line
          }}
          locale={{
            emptyText: formatMessage({ id: 'component.noticeIcon.empty' }),
            clear: formatMessage({ id: 'component.noticeIcon.clear' }),
          }}
          onClear={onNoticeClear}
          onPopupVisibleChange={onNoticeVisibleChange}
          loading={fetchingNotices}
          popupAlign={{ offset: [20, -16] }}
        >
          <NoticeIcon.Tab
            list={noticeData.notification}
            title={formatMessage({ id: 'component.globalHeader.notification' })}
            name="notification"
            emptyText={formatMessage({ id: 'component.globalHeader.notification.empty' })}
            emptyImage="https://gw.alipayobjects.com/zos/rmsportal/wAhyIChODzsoKIOBHcBk.svg"
          />
          <NoticeIcon.Tab
            list={noticeData.message}
            title={formatMessage({ id: 'component.globalHeader.message' })}
            name="message"
            emptyText={formatMessage({ id: 'component.globalHeader.message.empty' })}
            emptyImage="https://gw.alipayobjects.com/zos/rmsportal/sAuJeJzSKbUmHfBQRzmZ.svg"
          />
          <NoticeIcon.Tab
            list={noticeData.event}
            title={formatMessage({ id: 'component.globalHeader.event' })}
            name="event"
            emptyText={formatMessage({ id: 'component.globalHeader.event.empty' })}
            emptyImage="https://gw.alipayobjects.com/zos/rmsportal/HsIsxMZiWKrNUavQUXqx.svg"
          />
        </NoticeIcon> */}
        {/* {currentUser.name ? (
          <Dropdown overlay={menu}>
            <span className={`${styles.action} ${styles.account}`}>
              <Avatar
                size="small"
                className={styles.avatar}
                src={currentUser.avatar}
                alt="avatar"
              />
              <span className={styles.name}>{currentUser.name}</span>
            </span>
          </Dropdown>
        ) : (
          <Spin size="small" style={{ marginLeft: 8, marginRight: 8 }} />
        )} */}
        <a className={styles.action}>
          <SelectLang />
        </a>

        <div
          style={{
            display: this.state.consoleVisible ? "block" : "none",
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
                  this.setState({
                    consoleVisible: false,
                  });
                }}
                clusterStatus={this.props.clusterStatus}
                resizeable={true}
              />
            )}
        </div>
      </div>
    );
  }
}
