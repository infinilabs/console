import React, { PureComponent } from 'react';
import { Menu, Icon } from 'antd';
import styles from './BottomMenu.less';
import Debounce from "lodash-decorators/debounce";
import Licence from "@/components/Licence";

export default class BottomMenu extends PureComponent {

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

    const { theme, collapsed, global: { consoleInfo = {}, consoleLicence = {} }, onLicenceShow } = this.props;

    const text = `${consoleLicence.license_type} (${consoleInfo?.application?.version?.number})`

    return (
      <div className={styles.bottomMenu}>
        <Menu
          mode={'inline'}
          theme={theme}
          selectable={false}
        >
          <Menu.Item key='version' title={text} onClick={() => onLicenceShow()}>
            <div className={styles.version}>
              <Icon type="sketch" className={styles.sketch}/>
              {
                !collapsed && (
                  <>
                    <span>{text}</span>
                    <i className={styles.arrow}/>
                  </>
                )
              }
            </div>
          </Menu.Item>
          <Menu.Item key='collapse' title={'uncollapse'}>
            <div className={styles.collapse}>
              <Icon
                type={collapsed ? "menu-unfold" : "menu-fold"}
                onClick={this.toggle}
              />
            </div>
          </Menu.Item>
        </Menu>
      </div>
    );
  }
}
