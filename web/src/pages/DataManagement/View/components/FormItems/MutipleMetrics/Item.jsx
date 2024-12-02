import { ESPrefix } from "@/services/common";
import request from "@/utils/request";
import { Button, Form, Input, Select, Tabs } from "antd"
import { Fragment, useState } from "react";
import { cloneDeep } from "lodash";
import SingleMetrics from "../SingleMetrics/Item";

export default (props) => {

    const { value = [], onChange, objectFields, onSearchObjectFields } = props;

    const [activeKey, setActiveKey] = useState('0')

    const add = () => {
      const newValue = cloneDeep(value);
      newValue.push({ items: [], groups: [], formula: 'a'})
      onChange(newValue)
      setActiveKey(`${Number(activeKey) + 1}`)
    }

    const remove = (targetKey) => {
      const newValue = cloneDeep(value);
      newValue.splice(targetKey, 1)
      onChange(newValue)
      if (activeKey === targetKey) {
          setActiveKey('0')
      } else if (Number(activeKey) > targetKey){
          setActiveKey(`${Number(activeKey) - 1}`)
      }
    }

    const onEdit = (targetKey, action) => {
      const actions = { add, remove }
      actions[action](targetKey);
    };

    const onItemChange = (item, i) => {
      const newValue = cloneDeep(value);
      newValue[i] = item
      onChange(newValue)
    }

    return (
        <>
            <Tabs 
                type="editable-card" 
                onEdit={onEdit}
                activeKey={activeKey}
                onChange={setActiveKey}
                tabBarStyle={{ width: 'calc(100% - 28px)'}}
            >
                {
                    value.map((item, index) => {
                        return (
                            <Tabs.TabPane closable={value.length > 1} forceRender={true} tab={`Metric ${index+1}`} key={index}>
                                <div style={{ marginTop: 16}}>
                                    <SingleMetrics
                                        objectFields={objectFields}
                                        onSearchObjectFields={onSearchObjectFields}
                                        funcs={['latest']}
                                        value={item}
                                        onChange={(value) => onItemChange(value, index)}
                                    />
                                </div>
                            </Tabs.TabPane>
                        )
                    })
                }
            </Tabs>
        </>
    )
}