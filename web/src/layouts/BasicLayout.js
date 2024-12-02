import React, { useState } from "react";
import { Layout, Modal, Icon } from "antd";
import DocumentTitle from "react-document-title";
import isEqual from "lodash/isEqual";
import memoizeOne from "memoize-one";
import { connect } from "dva";
import { ContainerQuery } from "react-container-query";
import classNames from "classnames";
import pathToRegexp from "path-to-regexp";
import { enquireScreen, unenquireScreen } from "enquire-js";
import { formatMessage, getLocale } from "umi/locale";
import SiderMenu from "@/components/SiderMenu";
import Authorized from "@/utils/Authorized";
import SettingDrawer from "@/components/SettingDrawer";
import icon from "../assets/icon.png";
import logo from "../assets/logo.svg";
import Footer from "./Footer";
import Header from "./Header";
import Context from "./MenuContext";
import Exception403 from "../pages/Exception/403";
import { GlobalContext } from "./GlobalContext";
import { getAuthEnabled, getAuthority, isLogin } from "@/utils/authority";
import { router, history } from "umi";
import request from "@/utils/request";
import HealthProvider from "@/components/HealthProvider";
import { getSetupRequired } from "@/utils/setup";
import Licence, { LICENCE_ROUTES } from "@/components/Licence";
import moment from "moment";
import WelcomeModalContent from "@/components/infini/WelcomeModalContent";
import "./BasicLayout.scss";
import { ErrorBoundary } from "./ErrorBoundary";
import InvalidSecretNotification from "../components/infini/InvalidSecretNotification";
function wrap(func) {
  // Ensure we only wrap the function once.
  if (!func._wrapped) {
    func._wrapped = function() {
      try {
        func.apply(this, arguments);
      } catch (e) {
        console.error(e);
      }
    };
  }

  return func._wrapped;
}

var addEventListener = window.EventTarget.prototype.addEventListener;
window.EventTarget.prototype.addEventListener = function(
  event,
  callback,
  bubble
) {
  addEventListener.call(this, event, wrap(callback), bubble);
};

var removeEventListener = window.EventTarget.prototype.removeEventListener;
window.EventTarget.prototype.removeEventListener = function(
  event,
  callback,
  bubble
) {
  removeEventListener.call(this, event, callback?._wrapped || callback, bubble);
};

const { Content } = Layout;

// Conversion router to menu.
function formatter(data, parentAuthority, parentName) {
  return data
    .map((item) => {
      let locale = "menu";
      if (parentName && item.name) {
        locale = `${parentName}.${item.name}`;
      } else if (item.name) {
        locale = `menu.${item.name}`;
      } else if (parentName) {
        locale = parentName;
      }
      if (item.path) {
        const result = {
          ...item,
          locale,
          authority: item.authority || parentAuthority,
        };
        if (item.routes) {
          const children = formatter(item.routes, item.authority, locale);
          // Reduce memory usage
          result.children = children;
        }
        delete result.routes;
        return result;
      }

      return null;
    })
    .filter((item) => item);
}

const memoizeOneFormatter = memoizeOne(formatter, isEqual);

const query = {
  "screen-xs": {
    maxWidth: 575,
  },
  "screen-sm": {
    minWidth: 576,
    maxWidth: 767,
  },
  "screen-md": {
    minWidth: 768,
    maxWidth: 991,
  },
  "screen-lg": {
    minWidth: 992,
    maxWidth: 1199,
  },
  "screen-xl": {
    minWidth: 1200,
    maxWidth: 1599,
  },
  "screen-xxl": {
    minWidth: 1600,
  },
};
class BasicLayout extends React.PureComponent {
  constructor(props) {
    super(props);
    this.getPageTitle = memoizeOne(this.getPageTitle);
    this.getBreadcrumbNameMap = memoizeOne(this.getBreadcrumbNameMap, isEqual);
    this.breadcrumbNameMap = this.getBreadcrumbNameMap();
    this.matchParamsPath = memoizeOne(this.matchParamsPath, isEqual);
  }

  state = {
    rendering: true,
    isMobile: false,
    menuData: this.getMenuData(),
    welcomeModal: null,
  };

  linkToClusterRegist = (distribution) => {
    router.push(`/resource/cluster/regist?distribution=${distribution}`);
    this.state.welcomeModal.destroy();
  };

  async componentDidMount() {
    const { menuData } = this.state;
    const { dispatch, global } = this.props;
    if (getAuthEnabled() === "true") {
      dispatch({
        type: "user/fetchCurrent",
      });
    }
    dispatch({
      type: "setting/getSetting",
    });

    await dispatch({
      type: "global/saveData",
      payload: {
        menuData,
      },
    });
    dispatch({
      type: "global/fetchConsoleInfo",
    });

    this.renderRef = requestAnimationFrame(() => {
      this.setState({
        rendering: false,
      });
    });
    this.enquireHandler = enquireScreen((mobile) => {
      const { isMobile } = this.state;
      if (isMobile !== mobile) {
        // this.setState({
        //   isMobile: mobile,
        // });
      }
    });
    let firstLogin = localStorage.getItem("first-login");
    if (firstLogin === "true" && isLogin()) {
      localStorage.setItem("first-login", false);
      this.state.welcomeModal = Modal.info({
        title: (
          <div className="StartupPopoverTitle">
            {formatMessage({ id: "guide.startup.modal.title" })}
          </div>
        ),
        icon: "",
        width: 660,
        cancelButtonProps: { style: { display: "none" } },
        content: <WelcomeModalContent linkToClusterRegist />,
      });
    }
  }
  init() {
    const { dispatch, global } = this.props;
    if (getSetupRequired() === "true") {
      return;
    }
    if (this.isInited === true) {
      return;
    }
    if (getAuthEnabled() !== "true") {
      dispatch({
        type: "global/fetchClusterList",
        payload: {
          size: 200,
          name: "",
        },
      });
      this.isInited = true;
      return;
    }
    if (isLogin()) {
      dispatch({
        type: "global/fetchClusterList",
        payload: {
          size: 200,
          name: "",
        },
      });
      this.isInited = true;
    }
  }

  componentDidUpdate(preProps) {
    // After changing to phone mode,
    // if collapsed is true, you need to click twice to display
    this.breadcrumbNameMap = this.getBreadcrumbNameMap();
    const { isMobile } = this.state;
    const { collapsed } = this.props;
    if (isMobile && !preProps.isMobile && !collapsed) {
      this.handleMenuCollapse(false);
    }
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.renderRef);
    unenquireScreen(this.enquireHandler);
  }

  getContext() {
    const { location } = this.props;
    return {
      location,
      breadcrumbNameMap: this.breadcrumbNameMap,
    };
  }

  getMenuData() {
    const {
      route: { routes },
    } = this.props;
    return memoizeOneFormatter(routes);
    //
  }

  /**
   * 获取面包屑映射
   * @param {Object} menuData 菜单配置
   */
  getBreadcrumbNameMap() {
    const routerMap = {};
    const mergeMenuAndRouter = (data) => {
      data.forEach((menuItem) => {
        if (menuItem.children) {
          mergeMenuAndRouter(menuItem.children);
        }
        // Reduce memory usage
        routerMap[menuItem.path] = menuItem;
      });
    };
    mergeMenuAndRouter(this.getMenuData());
    return routerMap;
  }

  matchParamsPath = (pathname) => {
    const pathKey = Object.keys(this.breadcrumbNameMap).find((key) =>
      pathToRegexp(key).test(pathname)
    );
    return this.breadcrumbNameMap[pathKey];
  };

  getPageTitle = (pathname) => {
    const currRouterData = this.matchParamsPath(pathname);

    if (!currRouterData) {
      return APP_TITLE;
    }
    const message = formatMessage({
      id: currRouterData.locale || currRouterData.name,
      defaultMessage: currRouterData.name,
    });
    return `${message} - ${APP_TITLE}`;
  };

  getLayoutStyle = () => {
    const { isMobile } = this.state;
    const { fixSiderbar, collapsed, layout } = this.props;
    if (fixSiderbar && layout !== "topmenu" && !isMobile) {
      return {
        paddingLeft: collapsed ? "80px" : "256px",
      };
    }
    return null;
  };

  getContentStyle = () => {
    const { fixedHeader } = this.props;
    return {
      margin: "10px 10px 0",
      paddingTop: fixedHeader ? 64 : 0,
    };
  };

  handleMenuCollapse = (collapsed) => {
    const { dispatch } = this.props;
    dispatch({
      type: "global/changeLayoutCollapsed",
      payload: collapsed,
    });
  };

  renderSettingDrawer() {
    // Do not render SettingDrawer in production
    // unless it is deployed in preview.pro.ant.design as demo
    const { rendering } = this.state;
    if (
      (rendering || process.env.NODE_ENV === "production") &&
      APP_TYPE !== "site"
    ) {
      return null;
    }
    return <SettingDrawer />;
  }

  render() {
    this.init();

    const {
      navTheme,
      layout: PropsLayout,
      children,
      location: { pathname },
    } = this.props;
    const { isMobile, menuData } = this.state;
    const isTop = PropsLayout === "topmenu";
    const routerConfig = this.matchParamsPath(pathname);

    const renderInvalidSecretNotification = () => {
      const secretMismatch = localStorage.getItem("secret_mismatch");
      if(secretMismatch == "1"){
        return <InvalidSecretNotification/>
      }
      return null;
    };
    const layout = (
      <>
      {renderInvalidSecretNotification()}
      <Layout>
        {isTop && !isMobile ? null : (
          <SiderMenu
            icon={icon}
            logo={logo}
            Authorized={Authorized}
            theme={navTheme}
            onCollapse={this.handleMenuCollapse}
            menuData={menuData}
            isMobile={isMobile}
            handleMenuCollapse={this.handleMenuCollapse}
            {...this.props}
            onLicenceShow={() => this.licenceRef.open(false)}
          />
        )}
        <Layout
          style={{
            ...this.getLayoutStyle(),
            minHeight: "100vh",
          }}
        >
          <Header
            menuData={menuData}
            handleMenuCollapse={this.handleMenuCollapse}
            logo={icon}
            isMobile={isMobile}
            {...this.props}
          />

          <Content style={this.getContentStyle()}>
            <Authorized
              authority={routerConfig && routerConfig.authority}
              noMatch={<Exception403 />}
            >
              <GlobalContext.Provider
                value={{
                  ...(this.props.global || {}),
                  dispatch: this.props.dispatch,
                }}
              >
                <ErrorBoundary>{children}</ErrorBoundary>
              </GlobalContext.Provider>
            </Authorized>
          </Content>

          <Footer />
        </Layout>
      </Layout>
      </>
    );
    return (
      <React.Fragment>
        <DocumentTitle title={this.getPageTitle(pathname)}>
          <ContainerQuery query={query}>
            {(params) => (
              <Context.Provider value={this.getContext()}>
                <div className={classNames(params)}>{layout}</div>
              </Context.Provider>
            )}
          </ContainerQuery>
        </DocumentTitle>
        {this.renderSettingDrawer()}
        <Licence
          ref={(ref) => (this.licenceRef = ref)}
          application={this.props.global.consoleInfo?.application}
          version={this.props.global.consoleInfo?.application}
          licence={this.props.global.consoleLicence}
          location={this.props.location}
        />
      </React.Fragment>
    );
  }
}

const LayoutWithHealth = (props) => {
  const { children, ...restProps } = props;
  return (
    <HealthProvider location={props.location}>
      <BasicLayout {...restProps}>{children}</BasicLayout>
    </HealthProvider>
  );
};

export default connect(({ global, setting }) => ({
  collapsed: global.collapsed,
  layout: setting.layout,
  ...setting,
  global: global,
}))(LayoutWithHealth);
