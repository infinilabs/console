import { Drawer, Icon, Tabs } from "antd";
import { useState } from "react";
import SearchConfig from "./SearchConfig";
import LayoutConfig from "./LayoutConfig";

export interface ISearchConfig {
  trackTotalHits: boolean;
  timeout: number;
  whetherToSample: boolean;
  sampleSize: number;
  topNumber: number;
  sampleRecords: string;
}
interface IProps {
  searchConfig: ISearchConfig;
  onSearchConfigChange: (value: any, name: string) => void;
  layoutConfig: {
    layout: any;
    onChange: (layout: any) => void;
  }
}

export default (props: IProps) => {

    const { searchConfig, onSearchConfigChange, layoutConfig } = props;
    const [visible, setVisible] = useState(false);

    const [activeKey, setActiveKey] = useState("Search");

    return (
      <>
        <Icon 
          type={"setting"}
          title={"Insight Config"}
          onClick={() => setVisible(true)}
        />
        <Drawer
          title="Insight Config"
          placement="right"
          onClose={() => setVisible(false)}
          visible={visible}
          width={700}
          destroyOnClose
          headerStyle={{ display: 'none'}}
          bodyStyle={{ padding: 0 }}	
        >
          <Tabs 
            activeKey={activeKey} 
            onChange={setActiveKey} 
            // tabBarExtraContent={<Icon type="close" onClick={() => setVisible(false)}/>}
          >
            <Tabs.TabPane tab="Search" key="Search" style={{ padding: 24}}>
              <SearchConfig {...searchConfig} onChange={onSearchConfigChange}/>
            </Tabs.TabPane>
            {/* <Tabs.TabPane tab="Layout" key="Layout" style={{ padding: 24}}>
              <LayoutConfig {...layoutConfig}/>
            </Tabs.TabPane> */}
          </Tabs>
        </Drawer>
      </>
    )
}