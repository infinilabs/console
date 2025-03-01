import * as React from 'react';
import * as ReactDOM from 'react-dom';
import RcTabs, { TabPane } from 'rc-tabs';
import TabContent from 'rc-tabs/lib/TabContent';
import classNames from 'classnames';
import omit from 'omit.js';
import TabBar from './TabBar';
import {Icon} from 'antd';
import { ConfigConsumer, ConfigConsumerProps } from 'antd/lib/config-provider';
import './style/flex-bar.scss';

export type TabsType = 'line' | 'card' | 'editable-card';
export type TabsPosition = 'top' | 'right' | 'bottom' | 'left';

export interface TabsProps {
  activeKey?: string;
  defaultActiveKey?: string;
  hideAdd?: boolean;
  onChange?: (activeKey: string) => void;
  onTabClick?: Function;
  onPrevClick?: React.MouseEventHandler<HTMLElement>;
  onNextClick?: React.MouseEventHandler<HTMLElement>;
  tabBarExtraContent?: React.ReactNode | {left?: React.ReactNode, right?: React.ReactNode, append?: React.ReactNode} | null;
  tabBarStyle?: React.CSSProperties;
  type?: TabsType;
  tabPosition?: TabsPosition;
  onEdit?: (targetKey: string | React.MouseEvent<HTMLElement>, action: 'add' | 'remove') => void;
  size?: 'large' | 'default' | 'small';
  style?: React.CSSProperties;
  prefixCls?: string;
  className?: string;
  animated?: boolean | { inkBar: boolean; tabPane: boolean };
  tabBarGutter?: number;
  renderTabBar?: (
    props: TabsProps,
    DefaultTabBar: React.ComponentClass<any>,
  ) => React.ReactElement<any>;
  destroyInactiveTabPane?: boolean;
}

// Tabs
export interface TabPaneProps {
  /** 选项卡头显示文字 */
  tab?: React.ReactNode | string;
  style?: React.CSSProperties;
  closable?: boolean;
  className?: string;
  disabled?: boolean;
  forceRender?: boolean;
  key?: string;
}

export default class Tabs extends React.Component<TabsProps, any> {
  static TabPane = TabPane as React.ClassicComponentClass<TabPaneProps>;

  static defaultProps = {
    hideAdd: false,
    tabPosition: 'top' as TabsPosition,
  };

  componentDidMount() {
    // const NO_FLEX = ' no-flex';
    // const tabNode = ReactDOM.findDOMNode(this) as Element;
    // if (tabNode && !isFlexSupported && tabNode.className.indexOf(NO_FLEX) === -1) {
    //   tabNode.className += NO_FLEX;
    // }
  }

  removeTab = (targetKey: string, e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    if (!targetKey) {
      return;
    }

    const { onEdit } = this.props;
    if (onEdit) {
      onEdit(targetKey, 'remove');
    }
  };

  handleChange = (activeKey: string) => {
    const { onChange } = this.props;
    if (onChange) {
      onChange(activeKey);
    }
  };

  createNewTab = (targetKey: React.MouseEvent<HTMLElement>) => {
    const { onEdit } = this.props;
    if (onEdit) {
      onEdit(targetKey, 'add');
    }
  };

  renderTabs = ({ getPrefixCls }: ConfigConsumerProps) => {
    const {
      prefixCls: customizePrefixCls,
      className = '',
      size,
      type = 'line',
      tabPosition,
      children,
      animated = true,
      hideAdd,
    } = this.props;
    let { tabBarExtraContent } = this.props;

    let tabPaneAnimated = typeof animated === 'object' ? animated.tabPane : animated;

    // card tabs should not have animation
    if (type !== 'line') {
      tabPaneAnimated = 'animated' in this.props ? tabPaneAnimated : false;
    }

    const prefixCls = getPrefixCls('tabs', customizePrefixCls);
    const cls = classNames(className, {
      [`${prefixCls}-vertical`]: tabPosition === 'left' || tabPosition === 'right',
      [`${prefixCls}-${size}`]: !!size,
      [`${prefixCls}-card`]: type.indexOf('card') >= 0,
      [`${prefixCls}-${type}`]: true,
      [`${prefixCls}-no-animation`]: !tabPaneAnimated,
    });
    // only card type tabs can be added and closed
    let childrenWithClose: React.ReactElement<any>[] = [];
    if (type === 'editable-card') {
      childrenWithClose = [];
      React.Children.forEach(children as React.ReactNode, (child, index) => {
        if (!React.isValidElement(child)) return child;
        let { closable } = child.props;
        closable = typeof closable === 'undefined' ? true : closable;
        const closeIcon = closable ? (
          <Icon
            type="close"
            className={`${prefixCls}-close-x`}
            onClick={e => this.removeTab(child.key as string, e)}
          />
        ) : null;
        childrenWithClose.push(
          React.cloneElement(child, {
            tab: (
              <div className={closable ? undefined : `${prefixCls}-tab-unclosable`}>
                {child.props.tab}
                {closeIcon}
              </div>
            ),
            key: child.key || index,
          }),
        );
      });
      // Add new tab handler
      // if (!hideAdd) {
      //   tabBarExtraContent = (
      //     <span>
      //       <Icon type="plus" className={`${prefixCls}-new-tab`} onClick={this.createNewTab} />
      //       {tabBarExtraContent}
      //     </span>
      //   );
      // }
    }

    const newTabBarExtraContent: React.ReactNode = tabBarExtraContent ? (
      <><div className={`${prefixCls}-extra-content ant-tabs-extra-append`}>{tabBarExtraContent?.append}</div><div className={`${prefixCls}-extra-content ant-tabs-extra-left`} style={{float:'left', margin:'0 10px'}}>{tabBarExtraContent.left}</div><div style={{float:'right', marginRight:10}} className={`${prefixCls}-extra-content ant-tabs-extra-right`}>{tabBarExtraContent.right}</div></>
    ) : null;

    const { ...tabBarProps } = this.props;
    const contentCls: string = classNames(
      `${prefixCls}-${tabPosition}-content`,
      type.indexOf('card') >= 0 && `${prefixCls}-card-content`,
    );

    return (
      <RcTabs
        {...this.props}
        prefixCls={prefixCls}
        className={cls}
        tabBarPosition={tabPosition}
        renderTabBar={() => (
          <TabBar {...omit(tabBarProps, ['className'])} tabBarExtraContent={newTabBarExtraContent} />
        )}
        renderTabContent={() => (
          <TabContent className={contentCls} animated={tabPaneAnimated} animatedWithMargin />
        )}
        onChange={this.handleChange}
      >
        {childrenWithClose.length > 0 ? childrenWithClose : children}
      </RcTabs>
    );
  };

  render() {
    return <div className="flex-tabbar"><ConfigConsumer>{this.renderTabs}</ConfigConsumer></div>;
  }
}
